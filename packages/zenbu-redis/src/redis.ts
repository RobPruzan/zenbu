import Redis from "ioredis";
import { config } from "dotenv";
import { Context, Data, Effect } from "effect";
import { cwd } from "process";
import {ChatEvent } from "zenbu-plugin/src/v2/message-ws"

config();

/**
 *
 *
 * okay ill definitely need a new kind lets just do it
 */



// need to start typing this for the chat entries
export type ProjectStatus = "running" | "paused" | "killed";
export type RedisSchema = Record<
  string,
  | { kind: "status"; status: ProjectStatus }
  | {
      kind: "createdAt";
      createdAt: number;
    }
  | {
      kind: "chat-event";
      event: ChatEvent
    }
>;

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
    return client.set(key, JSON.stringify(value));
  });

export const RedisContext = Context.GenericTag<{
  client: ReturnType<typeof makeRedisClient>;
}>("RedisContext");
