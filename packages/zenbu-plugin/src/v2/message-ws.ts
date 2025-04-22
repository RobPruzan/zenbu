import { openai } from "@ai-sdk/openai";
import { streamText, TextStreamPart, tool, ToolSet } from "ai";
import { type Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { makeRedisClient, RedisContext } from "../../../zenbu-redis/src/redis";
import { Context, Data, Effect, Stream } from "effect";
import { NodeContext } from "@effect/platform-node";

import { FileSystem } from "@effect/platform";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";

type ClientEvent = {
  message: string;
};
import { CoreMessage, DataContent, Message } from "ai";
export type ChatEvent = {
  message: CoreMessage;
  /**
   * need to remember some of the problems i had
   *
   *
   *
   *
   * i can just back reference and read the code to extract some shit
   *
   *
   * sure why not
   *
   *
   * right i already know those scale and have some level of type safety
   *
   * er what type do i want to use
   */

  timestamp: number;
};

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
      kind: "not-active",
    } as ActiveAbortController; // stupid type hack

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
     */
    socket.on("message", async ({ event }: { event: ClientEvent }) => {
      const _ = Effect.runPromiseExit(
        Effect.gen(function* () {
          if (activeStreamController.kind === "active") {
            activeStreamController.abortController.abort();
          }
          const abortController = new AbortController();
          const { client } = yield* RedisContext;
          /**
           * persistence yay
           */
          const { fullStream } = streamText({
            model: openai("gpt-4.1"),
            abortSignal: abortController.signal,
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
                execute: async ({ goal }) => {
                  const exit = await Effect.runPromiseExit(
                    Effect.gen(function* () {
                      const { client } = yield* RedisContext;
                      /**
                       * blah blah get chat history so we can feed to model
                       */
                      const chatHistory = null!;
                    }).pipe(
                      Effect.provideService(RedisContext, {
                        client: redisClient,
                      })
                    )
                  );
                  return;
                },
                description: "Request a coder model to make the edit you want",
                args: {},
                parameters: z.object({
                  goal: z.string(),
                }),
              }),
            },
          });

          const stream = Stream.fromAsyncIterable<
            TextStreamPart<ToolSet>,
            ModelError
          >(fullStream, (e) => new ModelError({ error: e }));

          const result = yield* stream.pipe(
            Stream.runForEach((chunk) =>
              Effect.gen(function* () {
                const { client } = yield* RedisContext;
                /**
                 *
                 * yes, write that shi to redis
                 */
              })
            )
          );
        }).pipe(Effect.provideService(RedisContext, { client: redisClient }))
      );
    });
  });
};

export const getGeminiVideoURL = (path: string) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;

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
    return data;
  });
export class ModelError extends Data.TaggedError("GenericError")<{
  error: any;
}> {}

const parseModelResult = (outputWithCode: string) =>
  Effect.gen(function* () {
    /**
     * need to get the code with the format we want
     */

    return "parsed code";
  });

const serverEventsToMessages = (events: any) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const redis = yield* RedisContext;
  });

const writeCode = () =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    /**
     * read that shit from redis
     */
    const { fullStream, text } = streamText({ model: openai("gpt-4.1") });

    const stream = Stream.fromAsyncIterable<
      TextStreamPart<ToolSet>,
      ModelError
    >(fullStream, (e) => new ModelError({ error: e }));

    const result = yield* stream.pipe(
      Stream.runForEach((chunk) =>
        Effect.gen(function* () {
          const { client } = yield* RedisContext;
          /**
           *
           * yes, write that shi to redis
           */
        })
      )
    );

    const finalText = yield* Effect.tryPromise(() => text);
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

const applyCode = Effect.gen(function* () {
  const { client } = yield* RedisContext;
  const fs = yield* FileSystem.FileSystem;
  const randomAhFileContent = "";

  const { fullStream } = streamText({
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
      {
        role: "user",
        content: "Apply dis shit bro",
      },
    ],
  });

  const stream = Stream.fromAsyncIterable<TextStreamPart<ToolSet>, ModelError>(
    fullStream,
    (e) => new ModelError({ error: e })
  );
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
});

const reapplyCode = Effect.gen(function* () {
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

  const stream = Stream.fromAsyncIterable<TextStreamPart<ToolSet>, ModelError>(
    fullStream,
    (e) => new ModelError({ error: e })
  );
});
