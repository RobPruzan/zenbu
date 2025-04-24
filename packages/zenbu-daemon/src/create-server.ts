// import { Effect } from "effect";
// import { makeRedisClient } from "zenbu-redis";


// export const createServer = async (redisClient: ReturnType<typeof makeRedisClient>) => {
//   console.log("Starting server...");
//   await Effect.runPromise(
//     Effect.gen(function* () {
//       yield* restoreProjects;
//     })
//       .pipe(Effect.provide(NodeContext.layer))
//       .pipe(Effect.provideService(RedisContext, { client: redisClient }))
//   );
//   const app = new Hono()
//     .use("*", cors())
//     .get("/", async (opts) => {
//       const exit = await Effect.runPromiseExit(
//         Effect.gen(function* () {
//           const fs = yield* FileSystem.FileSystem;
//           const file = yield* fs.readFileString("index.html");
//           return file;
//         }).pipe(Effect.provide(NodeContext.layer))
//       );

//       switch (exit._tag) {
//         case "Success": {
//           return new Response(exit.value, {
//             headers: {
//               ["Content-type"]: "text/html",
//             },
//           });
//         }
//         case "Failure": {
//           return opts.json({ error: exit.cause.toJSON() });
//         }
//       }
//     })
//     .post(
//       "/start-project",
//       zValidator(
//         "json",
//         z.object({
//           name: z.string(),
//         })
//       ),
//       async (opts) => {
//         const { name } = opts.req.valid("json");
//         const exit = await Effect.runPromiseExit(
//           Effect.gen(function* () {
//             // this will probably throw a nasty error if you use this incorrectly
//             const createdAt = yield* getCreatedAt(name);
//             const project = yield* runProject({ name, createdAt });
//             yield* redisClient.effect.set(name, {
//               kind: "status",
//               status: "running",
//             });
//             return project;
//           })
//             .pipe(Effect.provide(NodeContext.layer))
//             .pipe(Effect.provideService(RedisContext, { client: redisClient }))
//         );

//         switch (exit._tag) {
//           case "Success": {
//             return opts.json({ success: true, project: exit.value });
//           }
//           case "Failure": {
//             const error = exit.cause.toJSON();
//             return opts.json({ error });
//           }
//         }
//       }
//     )
//     .post(
//       "/kill-project",
//       zValidator(
//         "json",
//         z.object({
//           name: z.string(),
//         })
//       ),
//       async (opts) => {
//         const { name } = opts.req.valid("json");
//         const exit = await Effect.runPromiseExit(
//           killProject(name)
//             .pipe(Effect.provide(NodeContext.layer))
//             .pipe(Effect.provideService(RedisContext, { client: redisClient }))
//         );

//         switch (exit._tag) {
//           case "Success": {
//             return opts.json({ success: true });
//           }
//           case "Failure": {
//             console.log("what", exit.cause);

//             const error = exit.cause.toJSON();
//             return opts.json({ error });
//           }
//         }
//       }
//     )
//     .post(
//       "/delete-project",
//       zValidator(
//         "json",
//         z.object({
//           name: z.string(),
//         })
//       ),
//       async (opts) => {
//         const { name } = opts.req.valid("json");
//         const exit = await Effect.runPromiseExit(
//           deleteProject(name)
//             .pipe(Effect.provide(NodeContext.layer))
//             .pipe(Effect.provideService(RedisContext, { client: redisClient }))
//         );

//         switch (exit._tag) {
//           case "Success": {
//             return opts.json({ success: true });
//           }
//           case "Failure": {
//             const error = exit.cause.toJSON();
//             return opts.json({ error });
//           }
//         }
//       }
//     )
//     .post("/nuke", async (opts) => {
//       const exit = await nuke();
//       return opts.json({ exit: exit.toJSON() });
//     })
//     .post("/get-projects", async (opts) => {
//       console.log("get projects request");

//       const exit = await Effect.runPromiseExit(
//         getProjects
//           .pipe(Effect.provide(NodeContext.layer))
//           .pipe(Effect.provideService(RedisContext, { client: redisClient }))
//       );

//       switch (exit._tag) {
//         case "Success": {
//           const projects = exit.value;
//           console.log("returning", projects);
//           return opts.json({ projects });
//         }
//         case "Failure": {
//           console.log("get fucked", exit.toJSON());

//           const error = exit.cause.toJSON();
//           return opts.json({ error });
//         }
//       }
//     })
//     .post("/create-project", async (opts) => {
//       const exit = await Effect.runPromiseExit(
//         spawnProject
//           .pipe(Effect.provide(NodeContext.layer))
//           .pipe(Effect.provideService(RedisContext, { client: redisClient }))
//       );

//       switch (exit._tag) {
//         case "Success": {
//           return opts.json({ project: exit.value });
//         }
//         case "Failure": {
//           const error = exit.cause.toJSON();
//           return opts.json({ error });
//         }
//       }
//     });

//   const port = 40_000;
//   const host = "localhost";
//   const $server = serve(
//     {
//       fetch: app.fetch,
//       port,
//       hostname: host,
//     },
//     (info) => {
//       console.log(`Server is running on http://${host}:${info.port}`);
//     }
//   );
//   // will inject websocket into this server
//   return app;
// };