import Redis from "ioredis";
import { config } from "dotenv";
import { Context, Data, Effect } from "effect";
config();

export type ProjectStatus ="running" | "paused" | "killed"
export type RedisSchema = Record<string, ProjectStatus>;

export const makeRedisClient = () => {
  const client = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD,
  });
  return {
    ...client,
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
