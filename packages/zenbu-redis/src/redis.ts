import Redis from "ioredis";
import { config } from "dotenv";
import { Context, Effect } from "effect";
config();

export type RedisSchema = {};

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

export const get = <K extends keyof RedisSchema>(key: K) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;

    const raw = yield* Effect.tryPromise(() => client.get(key));
    return raw ? (JSON.parse(raw) as RedisSchema[K]) : null;
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
