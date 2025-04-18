import Redis from "ioredis";
import { config } from "dotenv";
import { Context, Data, Effect } from "effect";
import { cwd } from "process";
config();

export type ProjectStatus = "running" | "paused" | "killed";
export type RedisSchema = Record<string, ProjectStatus>;
console.log("wat", cwd());

export const makeRedisClient = () => {
  const client = new Redis({
    path: "../zenbu-redis/redis-data/redis.sock",
  });

  return {
    ...client,
    set: client.set,
    get: client.get,
    effect: {
      get,
      set,
    },
  };
};

export class NotFoundError extends Data.TaggedError("NotFoundError")<{}> {}

export const get = <K extends keyof RedisSchema>(key: K) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const raw = yield* Effect.tryPromise(() => client.get(key));
    if (!raw) {
      return yield* new NotFoundError();
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
