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

export const getCreatedAt = (name: string) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const res = yield* client.effect.get(`${name}_createdAt`);
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

export const getProjects = Effect.gen(function* () {
  const command = `ps -o pid,command -ax | grep 'zenbu-daemon:project=' | grep -v grep || true`;
  const fs = yield* FileSystem.FileSystem;
  // okay so later we will make a dedicated zenbu store in some custom dir, or .zenbu, till then we hardcode the path
  // semantically the same thing so this impl won't have to change, just a common todo
  const projectNames = yield* fs.readDirectory(
    "/Users/robby/zenbu/packages/zenbu-daemon/projects"
  );
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
  const allProjects: Array<Project> = [...projects, ...killedProjectsMeta];

  return allProjects;
});
const killAllProjects = Effect.gen(function* () {
  const projects = yield* getProjects;
  const runningProjects = projects.filter(
    (project) => project.status === "running"
  );

  const killEffects = runningProjects.map((project) =>
    Effect.gen(function* () {
      const { client } = yield* RedisContext;
      process.kill(project.pid);
      yield* client.effect.set(project.name, {
        kind: "status",
        status: "killed",
      });
    })
  );

  yield* Effect.all(killEffects);
});
const nuke = Effect.gen(function* () {
  yield* killAllProjects;
  const { client } = yield* RedisContext;
  yield* Effect.tryPromise(() => client.flushdb());
  const fs = yield* FileSystem.FileSystem;
  yield* fs.remove("projects", { recursive: true });
  yield* fs.makeDirectory("projects");
});

export const createServer = async (
  redisClient: ReturnType<typeof makeRedisClient>
) => {
  console.log("Starting server...");
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* restoreProjects;
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
      const exit = await Effect.runPromiseExit(
        nuke
          .pipe(Effect.provide(NodeContext.layer))
          .pipe(Effect.provideService(RedisContext, { client: redisClient }))
      );

      return opts.json({ exit: exit.toJSON() });
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
  // will inject websocket into this server
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

const createProject = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const name = generateRandomName();
  const projectPath = `projects/${name}`;
  yield* fs.makeDirectory(projectPath);
  yield* fs.copy("templates/node-project", projectPath);
  const existing = yield* fs.readFileString(`${projectPath}/index.html`);
  yield* fs.writeFileString(
    `${projectPath}/index.html`,
    existing.replace("REPLACE ME", name)
  );
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

export class GenericError extends Data.TaggedError("GenericError")<{}> {}
export class RedisValidationError extends Data.TaggedError(
  "RedisValidationError"
)<{meta: unknown}> {}
export class ProjectNotFoundError extends Data.TaggedError(
  "ProjectNotFoundError"
)<{}> {}
export class ChildProcessError extends Data.TaggedError(
  "ChildProcessError"
)<{}> {}

const publishStartedProject = (name: string) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    // this state is used so we know at startup how to restore state
    client.effect.set(name, {
      kind: "status",
      status: "running",
    });
  });

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
    const { client } = yield* RedisContext;
    yield* client.effect.set(`${name}_createdAt`, {
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
    return `zenbu-daemon:project=${name}:assigned_port=${port}:created_at=${createdAt}`;
  });

const restoreProjects = Effect.gen(function* () {
  const projects = yield* getProjects;
  const { client } = yield* RedisContext;
  const startedProjects = projects.map((project) => {
    return Effect.gen(function* () {
      if (project.status !== "running") {
        return;
      }
      const createdAt = yield* getCreatedAt(project.name);
      yield* runProject({ name: project.name, createdAt });
      yield* client.effect.set(project.name, {
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
  const { name, createdAt } = yield* createProject;

  const project = yield* runProject({
    name,
    createdAt,
  });

  // publishing is for alerting to create a new warm instance which we aren't doing yet I think?
  // wait no it was to start tracking it correctly even if it dies we can re-up it
  yield* publishStartedProject(name);
  return project;
});

//

export const getProject = (name: string) =>
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
    const { client } = yield* RedisContext;

    if (project.status !== "running") {
      return;
    }

    process.kill(project.pid);

    yield* client.effect.set(project.name, {
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
    const { client } = yield* RedisContext;

    const rmEffect = fs.remove(project.cwd, { recursive: true });
    const redisEffect = client.effect.del(project.name);
    yield* Effect.all([rmEffect, redisEffect]);
  });

export type DaemonAppType = Awaited<ReturnType<typeof createServer>>;
