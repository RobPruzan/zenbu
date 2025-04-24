import { openai } from "@ai-sdk/openai";
import { streamText, TextStreamPart, tool, ToolSet } from "ai";
import { getProject, getProjects, Project } from "zenbu-daemon";
import { type Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { effect, z } from "zod";
import {
  ClientEvent,
  makeChatEventsKey,
  makeRedisClient,
  makeVideoCacheKey,
  ModelEvent,
  RedisContext,
} from "../../../zenbu-redis/src/redis";
import { Context, Data, Effect, Stream } from "effect";
import { NodeContext } from "@effect/platform-node";

import { FileSystem } from "@effect/platform";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";

import { CoreMessage, DataContent, Message } from "ai";
import { RedisValidationError } from "../../../zenbu-daemon/src/daemon";
import { server_eventsToMessage } from "./server-utils";
import { nanoid } from "nanoid";
import { iife } from "src/tools/message-runtime";
import { write } from "node:console";
import * as util from "util";
import { InvariantError, ModelError, TypecheckError } from "./shared-utils";

util.inspect.defaultOptions.depth = 5;

util.inspect.defaultOptions.showHidden = true;
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.colors = true;

const redisClient = makeRedisClient();

type ActiveAbortController =
  | { kind: "not-active" }
  | { kind: "active"; abortController: AbortController };

export const injectWebSocket = (server: HttpServer) => {
  const ioServer = new Server(server, {
    path: "/ws",
    serveClient: false,
    cors: {
      origin: "*", // narrow later
      methods: ["GET", "POST"],
    },
    transports: ["websocket"],
  });

  ioServer.use(async (socket, next) => {
    next();
  });

  ioServer.on("connection", async (socket) => {
    const roomId = socket.handshake.query.roomId as string;

    if (!roomId) {
      throw new Error("Invariant: roomId is required for socket connection");
    }

    socket.join(roomId);
    const activeStreamController = {
      current: {
        kind: "not-active",
      } as ActiveAbortController,
    };
    socket.on(
      "message",
      async (e: { event: ClientEvent; projectName: string }) => {
        const { event, projectName } = e;

        const exit = await Effect.runPromiseExit(
          Effect.gen(function* () {
            if (activeStreamController.current.kind === "active") {
              activeStreamController.current.abortController.abort();
            }
            const abortController = new AbortController();

            activeStreamController.current = {
              kind: "active",
              abortController,
            };

            const { client } = yield* RedisContext;
            // i should distribute this via context so the project can always be
            // accessed
            // woops yeah this is not gonna work since it's from a diff dir
            const project = yield* getProject(projectName);

            const MessageService = Effect.provideService(MessageContext, {
              path: "fake path for now",
              typecheckCommand: "tsc .",
              project,
              requestId: event.requestId,
              roomId,
              socket,
            });

            let record = yield* client.effect.getOrElse(
              makeChatEventsKey({ roomId }),
              () => null
            );
            console.log("record returned", record);

            if (!record) {
              record = { kind: "chat-events", events: [] };
              yield* client.effect.set(makeChatEventsKey({ roomId }), record);
            }
            if (record.kind !== "chat-events") {
              return yield* new RedisValidationError({
                meta: JSON.stringify({
                  shit: "what the sigma",
                  fuck: record,
                }),
              });
            }

            yield* client.effect.pushChatEvent(roomId, event);
            const events = yield* client.effect.getChatEvents(roomId);

            const messages = yield* server_eventsToMessage(events);

            /**
             * oh right how do we handle messages that failed? Er i guess just keep em there, let user retry?
             */

            const { fullStream } = streamText({
              model: openai("gpt-4.1"),
              abortSignal: abortController.signal,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful assistant, we are debugging right now so just respond with simple answers to make it easy for me",
                } satisfies CoreMessage,

                ...messages,
              ],
              toolCallStreaming: true,
              tools: {
                /**
                 * write code tool will be any time the model wants to write code, it asks
                 * the model to do it for it
                 *
                 * we must store previous chat messages of course, will need to give that in a good
                 * format
                 *
                 * I'm not gonna play any weird hacks with accumulating result in local variable,
                 * everything just gets written to redis
                 */
                writeCode: tool({
                  description:
                    "Request a coder model to make the edit you want",
                  parameters: z.object({
                    goal: z.string(),
                    path: z.string(),
                  }),
                  execute: async ({ goal, path }) => {
                    const exit = await Effect.runPromiseExit(
                      Effect.gen(function* () {
                        const { client } = yield* RedisContext;
                        const fs = yield* FileSystem.FileSystem;
                        const exists = yield* fs.exists(path);
                        if (!exists) {
                          // i wonder if we should just provide the models the internal errors and let it iterate?
                          yield* new InvariantError({
                            reason: "todo not implemented",
                          });
                        }

                        // const events = yield* client.effect.getChatEvents(roomId);
                        // const messages = yield* server_eventsToMessage(events);

                        yield* writeCode({
                          requestId: event.requestId,
                          roomId,
                          path,
                        });

                        // should make this system i guess
                        yield* client.effect.pushChatEvent(roomId, {
                          kind: "user-message",
                          context: [],
                          id: nanoid(),
                          requestId: event.requestId,
                          text: "You are now transitioning back to being an architect model, so you will not be able to write code till your active code model mode",
                          timestamp: Date.now(),
                        });
                      })
                        .pipe(
                          Effect.provideService(RedisContext, {
                            client: redisClient,
                          })
                        )
                        .pipe(Effect.provide(NodeContext.layer))
                        .pipe(MessageService)
                    );
                    return;
                  },
                }),
              },
            });

            const stream = Stream.fromAsyncIterable<
              TextStreamPart<{ stupid: any }>,
              ModelError
            >(fullStream, (e) => new ModelError({ error: e }));

            const result = yield* stream.pipe(
              Stream.runForEach((chunk) =>
                Effect.gen(function* () {
                  chunk.type === "text-delta" &&
                    console.log("mode lis chunking", chunk);

                  const { client } = yield* RedisContext;
                  const modelEvent: ModelEvent = {
                    kind: "model-message",
                    associatedRequestId: event.requestId,
                    id: nanoid(),
                    timestamp: Date.now(),
                    chunk,
                  };
                  yield* client.effect.pushChatEvent(roomId, modelEvent);
                  socket.emit("message", {
                    event: modelEvent,
                    projectName: project.name,
                  });
                })
              )
            );
          })
            .pipe(Effect.provideService(RedisContext, { client: redisClient }))
            .pipe(Effect.provide(NodeContext.layer))
        );

        console.log(exit);
      }
    );
  });
};

export const getGeminiVideoURL = (path: string) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;

    const record = yield* client.effect.getOrElse(
      makeVideoCacheKey({ path }),
      () => null
    );

    if (record && record.kind !== "video-cache") {
      return yield* new RedisValidationError({
        meta: "should be video cache, got:" + record.kind,
      });
    }
    if (record) {
      return record;
    }

    /**
     * need a quick cache lookup on the path in redis
     */

    /**
     * then i suppose the same thing we did before really kinda?
     * oh wait i already had a video cache lol
     */

    const fileManager = new GoogleAIFileManager(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY!
    );

    // todo change path
    const filePath = `.zenbu/video/${path}`;
    let geminiFile = yield* Effect.tryPromise(() =>
      fileManager.uploadFile(filePath, {
        name: `ai-${Math.random().toString(36).substring(7)}`,
        mimeType: "video/webm",
      })
    );

    /**
     * todo: need to retry on fail
     */
    do {
      if (geminiFile.file.state === FileState.ACTIVE) {
        break;
      }
      geminiFile = {
        file: yield* Effect.tryPromise(() =>
          fileManager.getFile(geminiFile.file.name)
        ),
      };
      yield* Effect.sleep("500 millis");
    } while (true);
    const data = {
      data: geminiFile.file.uri,
      mimeType: geminiFile.file.mimeType,
    };

    yield* redisClient.effect.set(makeVideoCacheKey({ path }), {
      ...data,
      kind: "video-cache",
    });
    return data;
  });

const parseModelResult = (outputWithCode: string) =>
  Effect.gen(function* () {
    /**
     * need to get the code with the format we want
     */

    return "parsed code";
  });

// todo: make args context
const writeCode = ({
  requestId,
  roomId,
  path,
}: {
  roomId: string;
  requestId: string;
  path: string;
}) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    /**
     * read that shit from redis
     */

    /**
     *
     * i kinda need to figure out recursion here and passing through context
     */
    const events = yield* client.effect.getChatEvents(roomId);
    const messages = yield* server_eventsToMessage(events);
    let codeResponse: null | string = null;
    const { fullStream, text } = streamText({
      messages: [
        {
          role: "system",
          content: "mhm yeah such a good system prompt to write code",
        },
        ...messages,
        {
          role: "system",
          content:
            "You have successfully turned yourself into a highly skilled coder model. You may write the code that you wanted to implement now",
        },
      ],
      tools: {
        reapply: tool({
          parameters: z.object({}),
          execute: async () => {
            const effect = Effect.gen(function* () {
              yield* new InvariantError({ reason: "not implemented yet shi" });
            });
            const exit = Effect.runPromiseExit(effect);
          },
          description:
            "If the apply model didn't apply, your code change right, call this and a smarter model will retry",
        }),
      },
      model: openai("gpt-4.1"),
    });

    const stream = Stream.fromAsyncIterable<
      TextStreamPart<{ stupid: any }>,
      ModelError
    >(fullStream, (e) => new ModelError({ error: e }));

    const result = yield* stream.pipe(
      Stream.runForEach((chunk) =>
        Effect.gen(function* () {
          const { client } = yield* RedisContext;

          // const chunkText = chunkToText(chunk);
          // if (!chunkText) {
          //   return chunkText;
          // }
          // er this is weird, i don't want the sub agent thread really in the global messages?
          // yes i do
          // no i don't
          /**
           * i need it in the global to read, but then i need to do a really
           * annoying transform over the data which i guess is fine but is
           * really annoying
           *
           *
           * no i just need model metadata
           */

          yield* client.effect.pushChatEvent(roomId, {
            kind: "model-message",
            associatedRequestId: requestId,
            id: nanoid(),
            timestamp: Date.now(),
            chunk,
          });
          /**
           *
           * yes, write that shi to redis
           */
        })
      )
    );

    const finalText = yield* Effect.tryPromise(() => text);
    const code = yield* parseModelResult(finalText).pipe(
      Effect.match({
        onSuccess: (value) => value,
        onFailure: () => {
          // realistically we want to recurse, todo for now
          return null;
        },
      })
    );
    if (!code) {
      return yield* new InvariantError({
        reason: "bad code output retry not implemented",
      });
    }

    const _ = yield* applyCode({
      code,
      path,
      roomId,
    }).pipe(
      Effect.mapError(() =>
        Effect.gen(function* () {
          yield* reapplyCodeSmarter().pipe(
            Effect.mapError((e) =>
              /**
               * will need to pass errors through because they will include
               * typechecking stuff so the next model should know what to do
               *
               *
               * this is a good place to apply frontend verification checks,
               * will need to distribute the socket via context so we can do
               * that
               *
               */
              Effect.gen(function* () {
                yield* reapplyCodeRewrite().pipe(
                  Effect.mapError((e) =>
                    Effect.gen(function* () {
                      yield* reapplyCodeReasoner();
                    })
                  )
                );
              })
            )
          );
        })
      )
    );
    // if this recurses its wrong actually

    /**
     *
     * need to, in order:
     * - apply
     * - typecheck
     * - confirm
     * - else reapply
     * - typecheck
     * - confirm
     * - rewrite whole file
     * - typecheck
     * - recurse
     */
  });

// rah put roomId as context
const applyCode = ({
  code,
  path,
  roomId,
}: {
  code: string;
  path: string;
  roomId: string;
}) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const fs = yield* FileSystem.FileSystem;
    const fileString = yield* fs.readFileString(path);
    const randomAhFileContent = "";
    const events = yield* client.effect.getChatEvents(roomId);
    const messages = yield* server_eventsToMessage(events);

    const { fullStream, text } = streamText({
      model: openai("gpt-4.1-mini"),
      providerOptions: {
        openai: {
          prediction: {
            type: "content",
            content: `\`\`\`
        ${randomAhFileContent}
        \`\`\``,
          },
        },
      },
      messages: [
        ...messages,
        {
          role: "user",
          content: `Here is the file content: ${fileString} \n\n\n Please integrate the following code to this file by providing the entire file back ${code}`,
        },
      ],
    });

    /**
     * er i do want to send the stream but I don't really want model to see it
     *
     * i guess i need some meta on the event and need to post process based on what i want the base model seeing?
     */
    const stream = Stream.fromAsyncIterable<
      TextStreamPart<{ stupid: any }>,
      ModelError
    >(fullStream, (e) => new ModelError({ error: e }));

    const _ = yield* stream.pipe(
      Stream.runForEach((chunk) =>
        Effect.gen(function* () {
          // todo what we do her
        })
      )
    );

    const finalText = yield* Effect.tryPromise(() => text);

    const applyCode = yield* parseModelResult(finalText);

    /**
     * we want to do a check on the
     */

    const previous = yield* fs.readFileString(path);
    yield* fs.writeFileString(path, code);
    // i wish i had some way of giving model lsp info/ querying lsp, obviously can do that, just need to figure out correct impl for that

    yield* typeCheck.pipe(
      Effect.onError(() =>
        Effect.gen(function* () {
          // yie`ld* fs.writeFileString(path,previous ).pipe(Effect.mapError(e => null))
          const res = yield* fs.writeFileString(path, previous).pipe(
            Effect.match({
              onFailure: () => null,
              onSuccess: () => {},
            })
          );
        })
      )
    );

    /**
     *
     * if this fails should we undo the apply and tell the model the error? probably, should have some weird state evolving over the file
     */
    yield* MessageContext;
  });

export const MessageContext = Context.GenericTag<{
  project: Project;
  socket: Socket;
  path: string;
  typecheckCommand: string;
  roomId: string;
  requestId: string;
}>("ProjectContext");

const typeCheck = Effect.gen(function* () {
  /**
   * I do need project context
   */
  const { path, typecheckCommand } = yield* MessageContext;
  // todo run type checker over correct project path

  if (false) {
    return yield* new TypecheckError({ errorString: "todo get error output" });
  }
});

const reapplyCodeSmarter = () =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    /**
     * get the chat history with the fail
     *
     *
     * do we need anything else?
     */
    const fs = yield* FileSystem.FileSystem;
    const randomAhFileContent = "";

    const { fullStream } = streamText({
      model: openai("gpt-4.1"),
      providerOptions: {
        openai: {
          prediction: {
            type: "content",
            content: `\`\`\`
        ${randomAhFileContent}
        \`\`\``,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: "Apply dis shit bro",
        },
      ],
    });

    const stream = Stream.fromAsyncIterable<
      TextStreamPart<ToolSet>,
      ModelError
    >(fullStream, (e) => new ModelError({ error: e }));
  });

const reapplyCodeRewrite = () => Effect.gen(function* () {});

const reapplyCodeReasoner = () => Effect.gen(function* () {});
