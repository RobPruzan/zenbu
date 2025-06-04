import { openai } from "@ai-sdk/openai";
import {
  generateText,
  smoothStream,
  streamText,
  TextStreamPart,
  tool,
  ToolSet,
} from "ai";
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
import { write } from "node:console";
import * as util from "util";
import {
  FileReadError,
  InvariantError,
  ModelError,
  TRANSITION_MESSAGE,
  TypecheckError,
} from "./shared-utils";
import { indexCodebase } from "src/tools/code-base-search";
import { execSync } from "node:child_process";
import { google } from "@ai-sdk/google";

util.inspect.defaultOptions.depth = 5;

util.inspect.defaultOptions.showHidden = true;
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.colors = true;

const redisClient = makeRedisClient();

type ActiveAbortController =
  | { kind: "not-active" }
  | { kind: "active"; abortController: AbortController };
let codebaseIndexPromptCache: string | null = null;
export const getCodebaseIndexPrompt = (path: string) =>
  Effect.gen(function* () {
    if (codebaseIndexPromptCache) {
      return codebaseIndexPromptCache;
    }
    const fs = yield* FileSystem.FileSystem;

    const prompt = yield* fs.readFileString(
      "/Users/robby/zenbu/packages/zenbu-plugin/src/codebase-index.md"
    );

    const templated = prompt.replace(
      "{codebaseString}",
      yield* Effect.tryPromise(() => indexCodebase(path))
    );
    codebaseIndexPromptCache = templated;

    return templated;
  });

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
        console.log("got message");

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
              typecheckCommand: "tsc .",
              project,
              requestId: event.requestId,
              roomId,
              socket,
              ioServer,
            });

            let record = yield* client.effect.getOrElse(
              makeChatEventsKey({ roomId }),
              () => null
            );
            // console.log("record returned", record);

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

            const HARD_CODED_BASE = "/Users/robby/zenbu/packages/zenbu-daemon/";
            const { fullStream, response } = streamText({
              onError: () => {
                console.log("error?");
              },
              onFinish: () => {
                console.log("naw");
              },

              onChunk: () => {
                console.log("hello?");
              },
              // model: google("gemini-2.5-flash-preview-04-17"),
              model: openai("gpt-4.1"),
              abortSignal: abortController.signal,
              maxSteps: 50,
              // experimental_transform: smoothStream(),
              messages: [
                {
                  role: "system",
                  content: `You are a coding architect, you maintain the flow of\
                  the conversation, interpret the users intent, and then use\
                  your writeCode tool to request a specialized coder model to\
                  implement the changes you want, you never write code yourself\

                  You have full context of the codebase, so this allows you to\
                  know precisely what the user is referring to when they ask for\
                  a change, they assume you understand everything about the codebase\
                  `,
                } satisfies CoreMessage,
                {
                  content: yield* getCodebaseIndexPrompt(
                    HARD_CODED_BASE + project.cwd
                  ),
                  role: "system",
                },

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
                    console.log("executing tool");
                    const exit = await Effect.runPromiseExit(
                      Effect.gen(function* () {
                        console.log("running");

                        const { client } = yield* RedisContext;
                        const fs = yield* FileSystem.FileSystem;
                        console.log("the path we got", path);

                        const exists = yield* fs.exists(path);
                        if (!exists) {
                          // i wonder if we should just provide the models the internal errors and let it iterate?
                          return yield* new FileReadError({
                            error: "File does not exist",
                            meta:
                              "Try again, here is the tree of the file system:" +
                              execSync(`tree ${project.cwd}`, {
                                encoding: "utf-8",
                              }),
                          });
                        }

                        // const events = yield* client.effect.getChatEvents(roomId);
                        // const messages = yield* server_eventsToMessage(events);
                        // yield* client.effect.pushChatEvent(roomId, {
                        //   kind: "model-message",
                        //   // context: [],
                        //   id: nanoid(),
                        //   associatedRequestId: event.requestId,
                        //   // text: "You are now transitioning back to being an architect model, so you will not be able to write code till your active code model mode with the writeCode tool",
                        //   chunk: {
                        //     type: "text-delta",
                        //     textDelta: "Writing code now",
                        //   },
                        //   timestamp: Date.now(),
                        // });

                        console.log("triggering write code");

                        const result = yield* writeCode({
                          requestId: event.requestId,
                          roomId,
                          path,
                          goal,
                        });

                        console.log("wrote code");

                        // should make this system i guess
                        const transitionEvent: ClientEvent = {
                          kind: "user-message",
                          context: [],
                          id: nanoid(),
                          requestId: event.requestId,
                          text: TRANSITION_MESSAGE,
                          timestamp: Date.now(),
                          meta: "tool-transition",
                        };
                        yield* client.effect.pushChatEvent(
                          roomId,
                          transitionEvent
                        );
                        ioServer.to(roomId).emit("message", {
                          event: transitionEvent,
                          projectName: project.name,
                        });

                        return result;
                      })
                        .pipe(
                          Effect.provideService(RedisContext, {
                            client: redisClient,
                          })
                        )
                        .pipe(Effect.provide(NodeContext.layer))
                        .pipe(MessageService)
                    );
                    console.log("exit", exit);

                    switch (exit._tag) {
                      case "Success": {
                        return exit.value;
                      }
                      case "Failure": {
                        return JSON.stringify(exit.toJSON());
                      }
                    }
                    // return;
                  },
                }),
              },
            });
            console.log('awaiting stream');
            

            const stream = Stream.fromAsyncIterable<
              TextStreamPart<Record<string, any>>,
              ModelError
            >(fullStream, (e) => new ModelError({ error: e }));
            console.log("stream?");

            const result = yield* stream.pipe(
              Stream.runForEach((chunk) =>
                Effect.gen(function* () {
                  chunk.type === "text-delta" &&
                    console.log("mode lis chunking", chunk);
                  console.log("what the shit", chunk);

                  const { client } = yield* RedisContext;
                  const modelEvent: ModelEvent = {
                    kind: "model-message",
                    associatedRequestId: event.requestId,
                    id: nanoid(),
                    timestamp: Date.now(),
                    chunk,
                  };
                  yield* client.effect.pushChatEvent(roomId, modelEvent);
                  ioServer.to(roomId).emit("message", {
                    event: modelEvent,
                    projectName: project.name,
                  });
                })
              )
            );
            console.log("now we start");
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
  goal,
}: {
  roomId: string;
  requestId: string;
  path: string;
  goal: string;
}) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const { socket, project, ioServer } = yield* MessageContext;
    const fs = yield* FileSystem.FileSystem;

    const events = yield* client.effect
      .getChatEvents(roomId)
      .pipe(Effect.mapError(() => "a"));
    const messages = yield* server_eventsToMessage(events).pipe(
      Effect.mapError(() => "b")
    );
    let codeResponse: null | string = null;
    const projectPath =
      "/Users/robby/zenbu/packages/zenbu-daemon/" + project.cwd;
    const filePath = path;
    const existingFileContent = yield* fs
      .readFileString(filePath)
      .pipe(Effect.mapError(() => "c"));

    const { fullStream, text } = streamText({
      experimental_transform: smoothStream(),
      messages: [
        {
          content: yield* getCodebaseIndexPrompt(projectPath).pipe(
            Effect.mapError(() => "d")
          ),
          role: "system",
        },
        {
          role: "system",
          content: `
            After you request a coder model to write code for a change, you will\
            be allowed to start writing code for the change requested in the next turn.\
            You will know you can write code when you see CODER MODE ACTIVATED\
            You can write the code however you want,\
            your entire output will be given to someone who will interpret your changes to\
            actually apply them to the file. Just make sure to stick to making edits to the target file.

            You just need to code the areas that need updates, someone else will\
            handle integrating the code to the file, you should just tell them\
            where it goes\


            You don't need to write comments to explain the change, they are\
            just a person so you can tell them where it goes, but remember they\
            can just patch, they don't actually know how to code, that's your\
            job\


            Never use base64 encoded strings/data URI's, there is always a way\
            to represent some image/audio/whatever without a really long string.\
            The apply model needs to type every individual character, so this\
            makes him want to kill himself. And you don't want him to kill\
            himself\          
            `,
        },
        ...messages,
        {
          role: "system",
          content: `CODER MODE ACTIVATED: You have successfully turned yourself into a\
            highly skilled coder model. You may write the code that you wanted\
            to implement now. You must only make changes for ${path}. Here is the\
            latest file contents: ${existingFileContent}
            `,
        },
      ],
      tools: {
        reapply: tool({
          parameters: z.object({}),
          execute: async () => {
            const effect = Effect.gen(function* () {
              yield* new InvariantError({
                reason: "not implemented yet shi",
              }).pipe(Effect.mapError(() => "e"));
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
      TextStreamPart<Record<string, any>>,
      ModelError
    >(fullStream, (e) => new ModelError({ error: e }));

    const result = yield* stream
      .pipe(
        Stream.runForEach((chunk) =>
          Effect.gen(function* () {
            const { client } = yield* RedisContext.pipe(
              Effect.mapError(() => "f")
            );

            const modelEvent: ModelEvent = {
              kind: "model-message",
              associatedRequestId: requestId,
              id: nanoid(),
              timestamp: Date.now(),
              chunk,
            };
            ioServer.to(roomId).emit("message", {
              event: modelEvent,
              projectName: project.name,
            });

            yield* client.effect
              .pushChatEvent(roomId, modelEvent)
              .pipe(Effect.mapError(() => "g"));
          })
        )
      )
      .pipe(Effect.mapError(() => "h"));

    const finalText = yield* Effect.tryPromise(() => text).pipe(
      Effect.mapError(() => "i")
    );

    const applyResult = yield* applyCode({
      path,
      coderModelOutput: finalText,
      goal,
    }).pipe(
      Effect.mapError(() =>
        Effect.gen(function* () {
          yield* reapplyCodeSmarter().pipe(
            Effect.mapError((e) =>
              Effect.gen(function* () {
                yield* reapplyCodeRewrite()
                  .pipe(
                    Effect.mapError((e) =>
                      Effect.gen(function* () {
                        yield* reapplyCodeReasoner().pipe(
                          Effect.mapError(() => "j")
                        );
                      })
                    )
                  )
                  .pipe(Effect.mapError(() => "k"));
              })
            )
          );
        })
      )
    );

    return applyResult;
  });

// rah put roomId as context
const applyCode = ({
  coderModelOutput,
  goal,
  path,
}: {
  coderModelOutput: string;
  goal: string;
  path: string;
}) =>
  Effect.gen(function* () {
    const { ioServer, project, requestId, roomId, typecheckCommand } =
      yield* MessageContext;
    const { client } = yield* RedisContext;
    const fs = yield* FileSystem.FileSystem;
    const fileString = yield* fs.readFileString(path);
    const events = yield* client.effect.getChatEvents(roomId);
    const messages = yield* server_eventsToMessage(events);

    const applySystemPrompt = `Given an existing file, and a description\
    of edits to make to a file, you will apply the changes to the file by\
    returning the entire file back by writing it with the changes applied.\
    You must return the code you want to be written to the file inside triple tick \`\`\`<lang>... \`\`\` format\
    so I can parse the result and write it to a file. You may never omit any code, and you must
    listen to the instructions of how to apply the code changes that are provided to you\
    `;

    const applyPrompt = `<existing_file>
    \`\`\`
    ${fileString}
    \`\`\`
    </existing_file>
    
    <code_edits>
    \`\`\`
    ${coderModelOutput}
    \`\`\`
    </code_edits>
    
    Please apply the code edits to the file and return the COMPLETE new file content. Infer the <code_edits> as ALWAYS ADDING/CHANGING code, unless specifically instructed to remove code. Write a single \`\`\` code block of the entire file.`;

    const { fullStream, text } = streamText({
      model: openai("gpt-4.1-nano"),
      experimental_transform: smoothStream(),
      providerOptions: {
        openai: {
          prediction: {
            type: "content",
            content: `\`\`\`
        ${fileString}
        \`\`\``,
          },
        },
      },
      system: applySystemPrompt,
      prompt: applyPrompt,
      temperature: 0.5,
      maxTokens: 30_000,
    });

    const stream = Stream.fromAsyncIterable<
      TextStreamPart<Record<string, any>>,
      ModelError
    >(fullStream, (e) => new ModelError({ error: e }));

    const _ = yield* stream.pipe(
      Stream.runForEach((chunk) =>
        Effect.gen(function* () {
          const modelEvent: ModelEvent = {
            kind: "model-message",
            associatedRequestId: requestId,
            id: nanoid(),
            timestamp: Date.now(),
            chunk,
          };
          ioServer.to(roomId).emit("message", {
            event: modelEvent,
            projectName: project.name,
          });
        })
      )
    );

    const finalText = yield* Effect.tryPromise(() => text);
    const applyCode = yield* parseCodeFromText(finalText);
    const previous = yield* fs.readFileString(path);
    yield* fs.writeFileString(path, applyCode);

    yield* typeCheck.pipe(
      Effect.onError(() =>
        Effect.gen(function* () {
          const res = yield* fs.writeFileString(path, previous).pipe(
            Effect.match({
              onFailure: () => null,
              onSuccess: () => {},
            })
          );
        })
      )
    );

    return applyCode;
  });
//   return applyCode;
// });

export class CodeParseError extends Data.TaggedError("CodeParseError")<{
  reason: string;
}> {}

const parseCodeFromText = (text: string) =>
  Effect.gen(function* () {
    const codeBlockRegex = /```(?:[\w-]*\n)?([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);

    if (!match) {
      return yield* new CodeParseError({
        reason: "No code block found in the text",
      });
    }

    const code = match[1].trim();

    if (!code) {
      return yield* new CodeParseError({ reason: "Empty code block found" });
    }

    return code;
  });

export const MessageContext = Context.GenericTag<{
  project: Project;
  socket: Socket;
  // path: string;
  typecheckCommand: string;
  roomId: string;
  requestId: string;
  ioServer: Server;
}>("ProjectContext");

const typeCheck = Effect.gen(function* () {
  /**
   * I do need project context
   */
  const { typecheckCommand } = yield* MessageContext;
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
