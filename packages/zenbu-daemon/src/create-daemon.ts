import { type Server as HttpServer, type Server } from "node:http";
import { Effect } from "effect";
import { makeRedisClient, RedisContext } from "zenbu-redis";
import { createServer, getProjects } from "./daemon";
import { NodeContext } from "@effect/platform-node";
import { injectWebSocket } from "./inject-websocket";

const redisClient = makeRedisClient();

// @ts-ignore
process.redisClient = redisClient;

process.on("beforeExit", async () => {
  const effect = Effect.gen(function* () {
    const projects = yield* getProjects;
    const { client } = yield* RedisContext;

    const markProjectsKilled = projects.map((project) =>
      Effect.gen(function* () {
        yield* client.effect.set(project.name, {
          kind: "status",
          status: "killed",
        });
      })
    );

    yield* Effect.all(markProjectsKilled);
  })
    .pipe(Effect.provide(NodeContext.layer))
    .pipe(Effect.provideService(RedisContext, { client: redisClient }));
  const _ = await Effect.runPromiseExit(effect);
});

createServer(redisClient).then(({ server }) => {
  injectWebSocket(server as HttpServer); // safe assert // safe assert https://github.com/orgs/honojs/discussions/1781#discussioncomment-7827318
});
