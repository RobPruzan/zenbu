import { Data, identity, Effect } from "effect";
import * as util from "node:util";

import { Option } from "effect";
import { Array as A } from "effect";
import { Hono } from "hono";

import { cors } from "hono/cors";

import { FileSystem } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { spawn, exec } from "child_process";
import getPort from "get-port";
import { makeRedisClient, RedisContext } from "zenbu-redis";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { validator } from "hono/validator";

const redisClient = makeRedisClient();

export const getCreatedAt = (name: string) =>
  Effect.gen(function* () {
    const res = yield* redisClient.effect.get(`${name}_createdAt`);
    if (res.kind !== "createdAt") {
      return yield* new RedisValidationError();
    }
    return res.createdAt;
  });
const execPromise = util.promisify(exec);
const RUN_SERVER_COMMAND = ["node", "index.js"];
const ADJECTIVES = [
  "funny",
  "silly",
  "quick",
  "happy",
  "bright",
  "calm",
  "eager",
  "jolly",
  "kind",
  "lively",
  "zesty",
  "witty",
  "dandy",
  "groovy",
  "nimble",
  "brave",
  "clever",
  "dapper",
  "elegant",
  "fierce",
  "gentle",
  "humble",
  "iconic",
  "jazzy",
  "keen",
  "loyal",
  "mighty",
  "noble",
  "optimal",
  "peppy",
  "quirky",
  "radiant",
  "smooth",
  "tender",
  "unique",
  "vibrant",
  "wise",
  "xenial",
  "youthful",
  "zealous",
  "ancient",
  "bold",
  "cosmic",
  "dazzling",
  "enchanted",
  "fluffy",
  "glowing",
  "heroic",
  "intrepid",
  "jovial",
];
const NOUNS = [
  "penguin",
  "wall",
  "cat",
  "dog",
  "river",
  "cloud",
  "star",
  "moon",
  "apple",
  "banana",
  "robot",
  "puffin",
  "comet",
  "galaxy",
  "meerkat",
  "tiger",
  "unicorn",
  "volcano",
  "walrus",
  "xylophone",
  "yeti",
  "zebra",
  "asteroid",
  "bison",
  "cactus",
  "dolphin",
  "eagle",
  "falcon",
  "giraffe",
  "hedgehog",
  "iguana",
  "jaguar",
  "koala",
  "lemur",
  "mammoth",
  "narwhal",
  "octopus",
  "panther",
  "quokka",
  "raccoon",
  "squirrel",
  "toucan",
  "viper",
  "wombat",
  "phoenix",
  "dragon",
  "wizard",
  "ninja",
  "samurai",
  "pirate",
];

const getProjects = Effect.gen(function* () {
  const command = `ps -o pid,command -ax | grep 'zenbu-daemon:project=' | grep -v grep || true`;

  const fs = yield* FileSystem.FileSystem;

  const projectNames = yield* fs.readDirectory("projects");
  console.log("the projects", projectNames);

  const execResult = yield* Effect.tryPromise(() => execPromise(command));
  const lines = execResult.stdout.trim().split("\n");

  const projectOptions = lines.map((line) =>
    Effect.gen(function* () {
      if (!line) {
        return Option.none();
      }
      const psPidMatch = line.trim().match(/^(\d+)\s+/);

      if (!psPidMatch) {
        return Option.none();
      }

      const pid = parseInt(psPidMatch[1], 10);
      const markerIndex = line.indexOf("zenbu-daemon:project=");

      if (markerIndex === -1) {
        return Option.none();
      }

      const markerArgument = line.slice(markerIndex);
      console.log("wut", markerArgument);

      const { name, port, createdAt } =
        yield* parseProcessMarkerArgument(markerArgument);

      // todo: don't hard code
      const projectPath = `projects/${name}`;
      // todo: return stdout

      return Option.some({ name, port, cwd: projectPath, pid, createdAt });
    })
  );

  const projects = yield* Effect.all(projectOptions).pipe(
    Effect.map((opts) =>
      A.filterMap(opts, identity).map((value) => ({
        ...value,
        // I think it must be running if there exist something from the PS, it may also be paused I should check in on that and see how to query that
        status: "running" as const,
      }))
    )
  );

  const killedProjects = projectNames.filter(
    (projectName) =>
      !projects.some((runningProject) => runningProject.name === projectName)
  );

  console.log("is it my goober?");

  const killedProjectsMetaEffects = killedProjects.map((name) =>
    Effect.gen(function* () {
      return {
        status: "killed" as const,
        // todo: don't hardcode here
        cwd: `projects/${name}`,
        name,
        createdAt: yield* getCreatedAt(name),
      };
    })
  );
  const killedProjectsMeta = yield* Effect.all(killedProjectsMetaEffects);
  const allProjects: Array<Project> = [
    ...projects,
    ...killedProjectsMeta,
    // ..),
  ];

  return allProjects;
});
const killAllProjects = Effect.gen(function* () {
  const projects = yield* getProjects;
  const runningProjects = projects.filter(
    (project) => project.status === "running"
  );

  const killEffects = runningProjects.map((project) =>
    Effect.gen(function* () {
      process.kill(project.pid);
      yield* redisClient.effect.set(project.name, {
        kind: "status",
        status: "killed",
      });
    })
  );

  yield* Effect.all(killEffects);
});
const nuke = () =>
  Effect.runPromiseExit(
    Effect.gen(function* () {
      yield* killAllProjects;
      yield* Effect.tryPromise(() => redisClient.flushdb());
      const fs = yield* FileSystem.FileSystem;
      yield* fs.remove("projects", { recursive: true });
      yield* fs.makeDirectory("projects");
    })
      .pipe(Effect.provideService(RedisContext, { client: redisClient }))
      .pipe(Effect.provide(NodeContext.layer))
  );
/**
 * so have some distinct tasks we know we want now:
 *
 * - some crud operations over managing servers
 * - a nice server to see all the servers up and perform the crud actions on (debug site)
 * - do I want to always keep servers up/ re-up all servers? Or do it lazy so when you click it, it spins up again and cold starts?
 * - cause we can just really aggressively prefetch and it would be the same cost
 *  - so do you always dynamically request the URL from the daemon anytime you click it? That seems like high latency
 *  - hm maybe not you can just cache it I suppose
 * - we have some simple ops like unzipping safely, running the dev server, process stats stuff that I can reference from the dog shit implementation
 * - what's entrypoint? Well I suppose a server where you want to take an action, then recursively implement each sub functionality yippy skippy
 *
 * hono server time
 *
 * right so we don't actually need an entrypoint effect script, why was that for some reason hard before?
 *
 */

export const createServer = async () => {
  console.log("Starting server...");

  await Effect.runPromise(
    Effect.gen(function* () {
      // yield* restoreProjects;
    })
      .pipe(Effect.provide(NodeContext.layer))
      .pipe(Effect.provideService(RedisContext, { client: redisClient }))
  );
  const app = new Hono()
    .use("*", cors())
    .get("/", async (opts) => {
      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const file = yield* fs.readFileString("index.html");
          return file;
        }).pipe(Effect.provide(NodeContext.layer))
      );

      switch (exit._tag) {
        case "Success": {
          return new Response(exit.value, {
            headers: {
              ["Content-type"]: "text/html",
            },
          });
        }
        case "Failure": {
          return opts.json({ error: exit.cause.toJSON() });
        }
      }
    })
    .post(
      "/start-project",
      zValidator(
        "json",
        z.object({
          name: z.string(),
        })
      ),
      async (opts) => {
        const { name } = opts.req.valid("json");
        const exit = await Effect.runPromiseExit(
          Effect.gen(function* () {
            // this will probably throw a nasty error if you use this incorrectly
            const createdAt = yield* getCreatedAt(name);
            const project = yield* runProject({ name, createdAt });
            yield* redisClient.effect.set(name, {
              kind: "status",
              status: "running",
            });
            return project;
          })
            .pipe(Effect.provide(NodeContext.layer))
            .pipe(Effect.provideService(RedisContext, { client: redisClient }))
        );

        switch (exit._tag) {
          case "Success": {
            return opts.json({ success: true, project: exit.value });
          }
          case "Failure": {
            const error = exit.cause.toJSON();
            return opts.json({ error });
          }
        }
      }
    )
    .post(
      "/kill-project",
      zValidator(
        "json",
        z.object({
          name: z.string(),
        })
      ),
      async (opts) => {
        const { name } = opts.req.valid("json");
        const exit = await Effect.runPromiseExit(
          killProject(name)
            .pipe(Effect.provide(NodeContext.layer))
            .pipe(Effect.provideService(RedisContext, { client: redisClient }))
        );

        switch (exit._tag) {
          case "Success": {
            return opts.json({ success: true });
          }
          case "Failure": {
            console.log("what", exit.cause);

            const error = exit.cause.toJSON();
            return opts.json({ error });
          }
        }
      }
    )
    .post(
      "/delete-project",
      zValidator(
        "json",
        z.object({
          name: z.string(),
        })
      ),
      async (opts) => {
        const { name } = opts.req.valid("json");
        const exit = await Effect.runPromiseExit(
          deleteProject(name)
            .pipe(Effect.provide(NodeContext.layer))
            .pipe(Effect.provideService(RedisContext, { client: redisClient }))
        );

        switch (exit._tag) {
          case "Success": {
            return opts.json({ success: true });
          }
          case "Failure": {
            const error = exit.cause.toJSON();
            return opts.json({ error });
          }
        }
      }
    )
    .post("/nuke", async (opts) => {
      const exit = await nuke();

      return opts.json({ success: true });
    })
    .post("/get-projects", async (opts) => {
      console.log("get projects request");

      const exit = await Effect.runPromiseExit(
        getProjects
          .pipe(Effect.provide(NodeContext.layer))
          .pipe(Effect.provideService(RedisContext, { client: redisClient }))
      );

      switch (exit._tag) {
        case "Success": {
          const projects = exit.value;
          console.log("returning", projects);
          return opts.json({ projects });
        }
        case "Failure": {
          console.log("get fucked", exit.toJSON());

          const error = exit.cause.toJSON();
          return opts.json({ error });
        }
      }
    })
    .post("/create-project", async (opts) => {
      const exit = await Effect.runPromiseExit(
        spawnProject
          .pipe(Effect.provide(NodeContext.layer))
          .pipe(Effect.provideService(RedisContext, { client: redisClient }))
      );

      switch (exit._tag) {
        case "Success": {
          return opts.json({ project: exit.value });
        }
        case "Failure": {
          const error = exit.cause.toJSON();
          return opts.json({ error });
        }
      }
    });

  const port = 40_000;
  const host = "localhost";
  const $server = serve(
    {
      fetch: app.fetch,
      port,
      hostname: host,
    },
    (info) => {
      console.log(`Server is running on http://${host}:${info.port}`);
    }
  );
  return app;
};

// todo: embed this logic so we never have collisions
// while (attempts < MAX_PROJECT_NAME_GENERATION_ATTEMPTS && !nameIsUnique) {
//   warmName = generateRandomName();
//   nameIsUnique =
//     !runningProjects.some((p) => p.name === warmName) &&
//     !activeProjectNames.has(warmName);
//   attempts++;
// }

const generateRandomName = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${suffix}`;
};
/**
 *
 * okay was worth a shot to see o3 could one shot this, but apparently not it doesn't know the API's (I have a feeling it can do it since everything is quite modular?)
 */

const createProject = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const name = generateRandomName();
  const projectPath = `projects/${name}`;
  yield* fs.makeDirectory(projectPath);
  yield* fs.copy("templates/node-project", projectPath);
  const createdAt = Date.now();
  yield* setCreatedAt(name, createdAt);
  return { name, projectPath, createdAt };
});

const runProject = ({ name, createdAt }: { name: string; createdAt: number }) =>
  Effect.gen(function* () {
    // todo: just a stub for now, impl later
    // need to make sure to give the process a title for metadata so we can search in the future

    const projects = yield* getProjects;
    const existing = projects.find(
      (project) => project.name === name && project.status === "running"
    ) as RunningProject | undefined;
    if (existing) {
      return existing;
    }

    const assignedPort = yield* Effect.tryPromise(() => getPort());

    /**
     * whats the dir?
     * projects/<name>/node-project?
     */

    // todo: don't hard code node-project, or forward slashes for directories
    const fs = yield* FileSystem.FileSystem;
    const actualCodePath = `projects/${name}`;

    const exists = yield* fs.exists(actualCodePath);
    console.log("exists?", exists, actualCodePath);

    if (!exists) {
      return yield* new GenericError();
    }

    const markerArgument = yield* getProcessTitleMarker({
      name,
      port: assignedPort,
      createdAt,
    });
    const args = [...RUN_SERVER_COMMAND.slice(1), markerArgument];
    const child = spawn(RUN_SERVER_COMMAND[0], args, {
      cwd: actualCodePath,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      // do we want to forward env? Maybe? Maybe not?
      env: { ...process.env, PORT: assignedPort.toString() }, // port gets red by the inner process, needs to be able to read process forwarded from parent process
    });

    // surprised we can access this synchronously ngl
    const pid = child.pid;
    if (!pid) {
      return yield* new ChildProcessError();
    }

    // todo: forward stdout,stderr stream

    const runningProject: RunningProject = {
      pid,
      cwd: actualCodePath,
      name,
      port: assignedPort,
      status: "running",
      createdAt,
    };
    return runningProject;
  });

export type EffectReturnType<T> =
  T extends Effect.Effect<infer R, any, any> ? R : never;

/**
 *  we will want some process manager with stop/start/resume/pause
 *
 *
 * or we can just make it functions that are called on data, that makes is serializable too which is quite nice
 *
 *
 */
export class GenericError extends Data.TaggedError("GenericError")<{}> {}
export class RedisValidationError extends Data.TaggedError(
  "RedisValidationError"
)<{}> {}
export class ProjectNotFoundError extends Data.TaggedError(
  "ProjectNotFoundError"
)<{}> {}
export class ChildProcessError extends Data.TaggedError(
  "ChildProcessError"
)<{}> {}

const publishStartedProject = (name: string) =>
  Effect.gen(function* () {
    // this state is used so we know at startup how to restore state
    redisClient.effect.set(name, {
      kind: "status",
      status: "running",
    });
  });

// will have to use this when i read everything
const parseProcessMarkerArgument = (markerArgument: string) =>
  Effect.gen(function* () {
    const match = markerArgument.match(
      /zenbu-daemon:project=(.+):assigned_port=(\d+):created_at=(\d+)/
    );
    if (!match) {
      return yield* new GenericError();
    }
    const port = parseInt(match[2], 10);
    const name = match[1];
    const createdAt = parseInt(match[3], 10);

    return { port, name, createdAt };
  });
export const setCreatedAt = (name: string, createdAt: number) =>
  Effect.gen(function* () {
    yield* redisClient.effect.set(`${name}_createdAt`, {
      createdAt,
      kind: "createdAt",
    });
  });
const getProcessTitleMarker = ({
  createdAt,
  name,
  port,
}: {
  name: string;
  port: number;
  createdAt: number;
}) =>
  Effect.gen(function* () {
    // const createdAt = Date.now();
    // yield* setCreatedAt(name, createdAt);
    return `zenbu-daemon:project=${name}:assigned_port=${port}:created_at=${createdAt}`;
  });

const restoreProjects = Effect.gen(function* () {
  const projects = yield* getProjects;
  const startedProjects = projects.map((project) => {
    return Effect.gen(function* () {
      if (project.status !== "running") {
        return;
      }
      const createdAt = yield* getCreatedAt(project.name);
      yield* runProject({ name: project.name, createdAt });
      yield* redisClient.effect.set(project.name, {
        kind: "status",
        status: "running",
      });
    });
  });

  yield* Effect.all(startedProjects);
});
export type RunningProject = {
  status: "running";
  name: string;
  port: number;
  cwd: string;
  pid: number;
  createdAt: number;
};

export type Project =
  | RunningProject
  | {
      status: "paused";
      name: string;
      port: number;
      cwd: string;
      pid: number;
      createdAt: number;
    }
  | {
      status: "killed";
      name: string;
      cwd: string;
      createdAt: number;
    };

/**
 *
 * TODO WE NEED LOTS OF INVARIANTS, SOME OPERATIONS (LIKE RUN PROJECT) ARE IMPLEMENTED AS IDEMPOTENT EFFECTS
 * SO IF THAT EVER IS NO LONGER THE CASE THEY WILL BREAK, THIS SHOULD BE CAUGHT BY AN INVARIANT
 */

// should be careful since its k:v can def have a memory leak if not paying attention/ tests

const spawnProject = Effect.gen(function* () {
  console.log("spawning");

  const { name, createdAt } = yield* createProject;
  console.log("created", name);

  const project = yield* runProject({
    name,
    createdAt,
  });
  console.log("got prject", project);

  // publishing is for alerting to create a new warm instance which we aren't doing yet I think?
  // wait no it was to start tracking it correctly even if it dies we can re-up it
  /**
   * yes this is some stuff we definitely need next:
   * - read active projects
   * - need to know if running or paused
   * - connect to the project
   *
   *
   * where do I want to sync this to?
   *
   * I could sync to redis?
   *
   *
   * like I don't really care to sync this to a relational db, and if we need to setup
   * redis anyways it works out
   *
   *
   * probably should be a package with a bunch of functions to connect to it easily?
   *
   *
   *
   */
  const serverInfo = yield* publishStartedProject(name);
  console.log("published");

  return project;
  // do we want to do this, or just alert some reactive process manager that it needs to re-derive
  /**
   *  if we have server info I suppose we can just send that to client?
   *
   * I mean this can be pretty simple why did we over complicate it so much before it literally did like nothing? I guess u could delete projects but that should be a small amount of effort over the abstraction
   *
   *
   * a function i definitely want is to resume servers, or is it just start? Or I guess resume is more of a high level thing that means pausing them and
   * and them being dead?
   *
   * like if you start a project maybe you can make it idempotent, or would it be easier if we knew the state of the system and routes the correct function
   * to a given environment at any moment?
   *
   * may make it tricky cause you want to be careful relying on something being in a certain state, because we don't control the underlying process we either
   * have to make potentially an expensive sys call/bash call, or sync which will be bug prone
   *
   * so I guess i'd rather make start server idempotent? That way starting a server just does nothing if already started....
   * uh wait what if you want to start a server, but a new instance and not re-use, now u have all this weird config and unique semantics
   *
   * while we can have initServer
   *
   * and start server, where start server is called in initServer and requires a path and it will run it
   *
   * if it's already running it will just error, so in the future if we want to spawn a new server [halt] it should actually be startProject not start server
   *
   * so u spawn a project, which creates a project, runs it, then publishes it
   *
   * you can run a project if you want a new project path, which you need to do at startup
   *
   * we can attach a state to a project (that I guess is persisted?) so that when we startup we can re-up the projects without worry
   *
   * will need to make sure to do that in parallel
   *
   * alright, whats next to actually start doing shit? I could actually create the process now, use the previous file a reference
   *
   * yes that's not a bad idea, but it's also not a bad idea to have a project ready to run in a local dir to make it quick
   *
   * i wont zip, just copy, i think zipping is stupid and made no sense
   *
   *
   */
});

const restoreProjectState = Effect.gen(function* () {});

// const

/**
 *
 * okay vibe time what are we doing next
 *
 *
 * i guess we would like to create a server, well what is the spec i defined i don't need to rewrite it
 * 
 * 
 * - can reference a directory of zip projects that it can use to start the project
- needs to unzip that in another dir
- needs to run that server, and provide the url it's running at (it needs to find an active port, and pass the PORT as an env to the start command
- because these projects are on disk, when the server starts up they wont be started, but the projects wont exist, so those projects are semantically paused, and we need to be able to resume
- process state should be derived from the os, meaning we give the process a title with metadata so we can always query the OS for info about the process, if it ever dies, some state about it changes, its in the OS hands and we are reading so its safe. If we stored that info in memory we have to handle sync (which is bug prone)
- this needs to be long lasting, and we interface it with a hono server with endpoints for actions you can perform
- we should have background processes that background other servers, if they haven't been opened for 6 hours, they should be paused (but not deleted)
- when listing projects, we should always see all projects, and their status
- we should have the ability to read the stdout/pstat of all the processes (like cpu %/memory) , and the stdout is so we can read the full server log at any point when querying (can't just dynamically query it, need to always be reading and manually maintaining the stdout stream in memory)
- it would be nice to know subprocesses that the process we spawned (via the dev command for the zip file we unzipped) has, but that should not be maintained in memory, there should be a function we can query over a process to determine its subprocesses (and info about them)
- for each zip file, you can assume unzipping it will create a directory called "project", inside of it running pnpm run dev is a valid way to start the server, but you must make sure its run from the context of that direcotry, if u run it in the wrong context it will trigger install of my monorepo
- when the server is spawned for the first time ever, you must run pnpm install, and await till that's complete to run pnpm run dev (pnpm install && pnpm run dev)

 */
process.on("beforeExit", async () => {
  const effect = Effect.gen(function* () {
    const projects = yield* getProjects;

    const markProjectsKilled = projects.map((project) =>
      Effect.gen(function* () {
        yield* redisClient.effect.set(project.name, {
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

createServer();

/**
 *
 *
 * just for debugging it would be nice if I could delete projects nicely, probably quite simple just a few compositions
 *
 * oops I should have a kill then compose a delete
 *
 */
const getProject = (name: string) =>
  Effect.gen(function* () {
    const projects = yield* getProjects;

    const project = projects.find((project) => project.name === name);

    if (!project) {
      return yield* new ProjectNotFoundError();
    }
    return project;
  });

const killProject = (name: string) =>
  Effect.gen(function* () {
    /**
     * technically doing a get projects then filtering is the same wrapper operation I can do
     */

    const project = yield* getProject(name);

    if (project.status !== "running") {
      return;
    }

    process.kill(project.pid);

    yield* redisClient.effect.set(project.name, {
      kind: "status",
      status: "killed",
    });
  });

// todo: migrate to passing around id's this is easy
const deleteProject = (name: string) =>
  Effect.gen(function* () {
    yield* killProject(name);
    const fs = yield* FileSystem.FileSystem;
    const project = yield* getProject(name);

    const rmEffect = fs.remove(project.cwd, { recursive: true });
    const redisEffect = redisClient.effect.del(project.name);
    yield* Effect.all([rmEffect, redisEffect]);
  });

/**
 *
 * er I don't really care about pausing/resuming for now that's just an optimization
 *
 * project starts are fast so I can do optimizations like prewarmed servers when I have something good to validate against it
 */

export type DaemonAppType = Awaited<ReturnType<typeof createServer>>;
