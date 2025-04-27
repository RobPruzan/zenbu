import Redis from "ioredis";
import { config } from "dotenv";
import { Context, Data, Effect } from "effect";
import { cwd } from "process";
import { RedisValidationError } from "../../zenbu-daemon/src/daemon";
import { TextStreamPart } from "ai";

config();

/**
 *
 *
 * okay ill definitely need a new kind lets just do it
 */

// need to start typing this for the chat entries

export type ModelEvent = {
  chunk: TextStreamPart<Record<string,any>>;
  timestamp: number;
  kind: "model-message";
  id: string;
  associatedRequestId: string;
};

export type ClientEvent = {
  id: string;
  kind: "user-message";
  context: Array<
    { kind: "image"; filePath: string } | { kind: "video"; filePath: string }
  >;
  text: string;
  timestamp: number;
  requestId: string;
  meta?: "tool-transition"
};


export type PartialEvent = ClientEvent | ModelEvent;
export type ProjectStatus = "running" | "paused" | "killed";
export type RedisSchema = Record<
  string,
  | { kind: "status"; status: ProjectStatus }
  | {
      kind: "createdAt";
      createdAt: number;
    }
  | ChatEvents
  | {
      kind: "video-cache";
      data: string;
      mimeType: string;
    }
>;

type ChatEvents = {
  kind: "chat-events";
  events: Array<PartialEvent>;
};

export const makeVideoCacheKey = ({ path }: { path: string }) => {
  return `${path}_video_cache`;
};

export const makeChatEventsKey = ({ roomId }: { roomId: string }) => {
  return `${roomId}_chat-events`;
};

export const makeRedisClient = (opts?: { tcp?: boolean }) => {
  const client = opts?.tcp
    ? new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      })
    : new Redis({
        path: "../zenbu-redis/redis-data/redis.sock",
      });

  const effectClient = {
    get,
    set,
    del,
    getOrElse,
    /**
     * NO NO STOP COUPLING REDIS TO CHAT NO STOP NOO
     */
    pushChatEvent,
    getChatEvents,
  };
  // @ts-expect-error
  client.effect = effectClient;

  return client as typeof client & { effect: typeof effectClient };
};

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  key: string;
  list: Array<any>;
}> {}

export const del = <K extends keyof RedisSchema>(key: K) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const res = yield* Effect.tryPromise(() => client.del(key));
    return res;
  });

export const getOrElse = <K extends keyof RedisSchema, T>(
  key: K,
  orElse: () => T
) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const raw = yield* Effect.tryPromise(() => client.get(key));
    if (!raw) {
      return orElse();
    }
    return JSON.parse(raw) as RedisSchema[K];
  });
export const get = <K extends keyof RedisSchema>(key: K) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const raw = yield* Effect.tryPromise(() => client.get(key));
    if (!raw) {
      return yield* new NotFoundError({
        key,
        list: yield* Effect.tryPromise(() => client.keys("*")),
      });
    }
    return JSON.parse(raw) as RedisSchema[K];
  });

export const set = <K extends keyof RedisSchema>(
  key: K,
  value: RedisSchema[K]
) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    return yield* Effect.tryPromise(() =>
      client.set(key, JSON.stringify(value))
    );
  });

const getChatEvents = (roomId: string) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const key = makeChatEventsKey({ roomId });
    const previous = yield* client.effect
      .get(key)
      .pipe(Effect.match({ onSuccess: (data) => data, onFailure: () => null }));
    if (!previous) {
      return [];
    }
    if (previous.kind !== "chat-events") {
      return yield* new RedisValidationError({
        meta: "wrong kind, should be chat events:" + previous.kind,
      });
    }

    return previous.events;
  });

export const pushChatEvent = (roomId: string, event: PartialEvent) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const key = makeChatEventsKey({ roomId });
    const previous = yield* client.effect.get(key);
    if (!previous) {
      return yield* Effect.tryPromise(() =>
        client.set(key, JSON.stringify([event]))
      );
    }
    if (previous.kind !== "chat-events") {
      return yield* new RedisValidationError({
        meta: "wrong kind, should be chat events:" + previous.kind,
      });
    }
    return yield* Effect.tryPromise(() =>
      client.set(
        key,
        JSON.stringify({
          events: [...previous.events, event],
          kind: "chat-events",
        } satisfies ChatEvents)
      )
    );
  });

export const RedisContext = Context.GenericTag<{
  client: ReturnType<typeof makeRedisClient>;
}>("RedisContext");
