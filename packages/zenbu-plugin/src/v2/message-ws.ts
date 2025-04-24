import { openai } from "@ai-sdk/openai";
import { streamText, TextStreamPart, tool, ToolSet } from "ai";
import { type Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { effect, z } from "zod";
import {
  ClientEvent,
  makeChatEventsKey,
  makeRedisClient,
  makeVideoCacheKey,
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
// type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

const redisClient = makeRedisClient();

/**
 * oh actually do we want to wrap the whole thing in an effect and read the context for the inject there? Hm
 */

// const RoomContext = Context.GenericTag<{
//   activeStreamController:
//     | { controller: AbortController; kind: "active" }
//     | { kind: "not-active" };
//   roomId: string;
// }>("RoomContext");

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

    /**
     *
     * lets reiterate what we want and get everything back into ram
     *
     * we don't want to build multi threading into the model yet
     *
     * i don't want to do structured patches, they just don't seem to work well
     * and depend on the model on the format they like, so we shall just ask them to output
     * a proposed change and will have gpt4.1 mini apply, 4.1 reapply
     *
     * should be really easy cause u just dump edit model output
     *
     * i really want to keep doing smarter model high level thinks then claude implements
     * or something, i don't think I care about latency an insane amount if it works well
     *
     * then we can hot swap any model pretty well
     *
     * the video thing we know how to solve
     *
     * cancellation i think we know how to solve
     */

    if (!roomId) {
      throw new Error("Invariant: roomId is required for socket connection");
    }

    /**
     *
     * hm i wonder how this would work if the boundary was much more expensive
     *
     * i guess a local synced cache would do wonders
     *
     * the mental model of "what if the boundary didn't exist" is quite useful
     *
     *
     * cause you can always wrap it in an optimistic+sync
     */

    // we might want this as context actually
    // actually yeah we do, we want room level context and message level context, just make message passing absurdly easy
    socket.join(roomId);
    const activeStreamController = {
      current: {
        kind: "not-active",
      } as ActiveAbortController,
    }; // stupid type hack

    /**
     * okay what's left
     *
     * we have to compose
     * parse model results
     * pipe them together
     * actually store in redis
     * fetch the initial state of chat from redis through trpc
     * do the events -> chat message parsing, not isomorphic
     * handle video/images
     * do image/vide upload again
     *  - this time the video upload will not be retarded
     * `
     *
     *
     *
     * im dumb i forgot i wanted this to be decoupled
     *
     *
     * i guess its fine for now, i just need a router pretty simple
     */
    // ug i should make this project id im being lazy, project name is basically a stupid id rn
    socket.on(
      "message",
      async ({ event }: { event: ClientEvent; projectName: string }) => {
        const _ = Effect.runPromiseExit(
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

            const record = yield* client.effect.get(
              makeChatEventsKey({ roomId })
            );
            if (record.kind !== "chat-events") {
              return yield* new RedisValidationError();
            }
            /**
             * persistence yay
             */

            // lowkey i should mock the ai sdk maybe?

            yield* client.effect.pushChatEvent(roomId, event);
            const events = yield* client.effect.getChatEvents(roomId);
            const messages = yield* server_eventsToMessage(events);

            const { fullStream } = streamText({
              model: openai("gpt-4.1"),
              abortSignal: abortController.signal,
              messages: [
                // {
                //   role: 'tool',
                //   content: [{

                //   }]
                // },
                {
                  role: "system",
                  content: "i need a system prompt for this sexy ass lil model",
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
                        .pipe(
                          Effect.provideService(ProjectContext, {
                            path: "fake path for now",
                            typecheckCommand: "tsc .",
                          })
                        )
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
                  const { client } = yield* RedisContext;
                  client.effect.pushChatEvent(roomId, {
                    kind: "model-message",
                    associatedRequestId: event.requestId,
                    id: nanoid(),
                    timestamp: Date.now(),
                    chunk,
                  });
                })
              )
            );
          })
            .pipe(Effect.provideService(RedisContext, { client: redisClient }))
            .pipe(Effect.provide(NodeContext.layer))
        );
      }
    );
  });
};

// export const chunkToText = (chunk: TextStreamPart<{stupid:any}>) => {
//   switch (chunk.type) {
//     case "reasoning": {
//       return chunk.textDelta;
//     }
//     case 'tool-result': {
//       /**
//        * right the reason i stopped here is because i probably need to discriminate union over everything and just store the chunk result?
//        * and then when we to message we accumulate that, that's fine
//        */
//       // return chunk.
//     }

//     case "text-delta": {
//       return chunk.textDelta;
//     }
//     case "tool-call-delta": {
//       return chunk.argsTextDelta;
//     }

//     default: {
//       return null;
//     }
//   }
// };

export const getGeminiVideoURL = (path: string) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;

    const record = yield* client.effect.getOrElse(
      makeVideoCacheKey({ path }),
      () => null
    );

    if (record && record.kind !== "video-cache") {
      return yield* new RedisValidationError();
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
export class ModelError extends Data.TaggedError("GenericError")<{
  error: any;
}> {}
export class TypecheckError extends Data.TaggedError("TypecheckError")<{
  errorString: string;
}> {}
export class InvariantError extends Data.TaggedError("InvariantError")<{
  reason?: string;
  context?: unknown;
}> {}
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
               * will need to pass errors through because they will include typechecking stuff so the next model should know what to do
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
    yield* ProjectContext;
  });

export const ProjectContext = Context.GenericTag<{
  path: string;
  typecheckCommand: string;
}>("ProjectContext");

const typeCheck = Effect.gen(function* () {
  /**
   * I do need project context
   */
  const { path, typecheckCommand } = yield* ProjectContext;
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
