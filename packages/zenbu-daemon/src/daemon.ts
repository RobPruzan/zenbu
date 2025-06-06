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
import { injectWebSocket } from "./inject-websocket";

export const getCreatedAt = (name: string) =>
  Effect.gen(function* () {
    const { client } = yield* RedisContext;
    const res = yield* client.effect.get(`${name}_createdAt`);
    if (res.kind !== "createdAt") {
      return yield* new RedisValidationError({
        meta: "not created at, was:" + res.kind,
      });
    }
    return res.createdAt;
  });
const execPromise = util.promisify(exec);
// const getCommand = (port: number) =>
//   `bun install && bun run dev --port ${port}`.split(" ");
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

const getLines = Effect.gen(function* () {
  const command = `ps -o pid,command -ax | grep 'zenbu-daemon:project=' | grep -v grep || true`;
  const execResult = yield* Effect.tryPromise(() => execPromise(command));
  return execResult;
});

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
        console.log("no pid match");

        return Option.none();
      }

      const pid = parseInt(psPidMatch[1], 10);
      const markerIndex = line.indexOf("zenbu-daemon:project=");

      if (markerIndex === -1) {
        console.log("no marker index");

        return Option.none();
      }

      const process = yield* parseProcessMarkerArgument(line).pipe(
        Effect.match({ onSuccess: (v) => v, onFailure: () => null })
      );
      if (!process) {
        console.log("no process");

        return Option.none();
      }
      const { createdAt, name, port } = process;

      // todo: don't hard code
      const projectPath = `projects/${name}`;
      // todo: return stdout

      console.log("RETURNING SOME SHOULD NOT BE DONE", name);

      return Option.some({ name, port, cwd: projectPath, pid, createdAt });
    })
  );

  console.log("lines", lines);

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
      console.log("killing", name);

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

  console.log(
    "all projects",
    allProjects.filter((p) => p.status === "running")
  );

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
              ["Origin-Agent-Cluster"]: "?1",
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
        console.log("start project request", name);
        const exit = await Effect.runPromiseExit(
          Effect.gen(function* () {
            // this will probably throw a nasty error if you use this incorrectly
            console.log(
              "projects before",
              (yield* getProjects).filter((p) => p.status === "running")
            );
            const createdAt = yield* getCreatedAt(name);
            const project = yield* runProject({ name, createdAt });
            console.log("running", project);

            yield* redisClient.effect.set(name, {
              kind: "status",
              status: "running",
            });

            console.log(
              "projects now",
              (yield* getProjects).filter((p) => p.status === "running")
            );

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
      const exit = await Effect.runPromiseExit(
        getProjects
          .pipe(Effect.provide(NodeContext.layer))
          .pipe(Effect.provideService(RedisContext, { client: redisClient }))
      );

      switch (exit._tag) {
        case "Success": {
          const projects = exit.value;
          return opts.json({ projects });
        }
        case "Failure": {
          const error = exit.cause.toJSON();
          return opts.json({ error });
        }
      }
    })
    .post(
      "/create-project",

      zValidator(
        "json",
        z.object({
          pathToSymlinkAt: z.string(),
        })
      ),

      async (opts) => {
        const exit = await Effect.runPromiseExit(
          spawnProject({
            pathToSymlinkAt: opts.req.valid("json").pathToSymlinkAt,
          })
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
      }
    );

  const port = 40_000;
  const host = "localhost";
  const server = serve(
    {
      fetch: app.fetch,
      port,
      hostname: host,
    },
    (info) => {
      console.log(`Server is running on http://${host}:${info.port}`);
    }
  );

  return { app, server };
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
  yield* fs.copy("templates/vite-template-v3", projectPath);

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
    // console.log("exists?", exists, actualCodePath);

    if (!exists) {
      return yield* new GenericError();
    }

    const title = yield* getProcessTitleMarker({
      name,
      port: assignedPort,
      createdAt,
    });
    console.log("projects before install", yield* getLines);

    const installChild = spawn("bun", ["install"], {
      cwd: actualCodePath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    yield* Effect.async<void, ChildProcessError>((resume) => {
      installChild.stdout?.on("data", (data) => {
        console.log("Install stdout:", data.toString());
      });

      installChild.stderr?.on("data", (data) => {
        console.log("Install stderr:", data.toString());
      });

      installChild.on("close", (code) => {
        if (code === 0) {
          resume(Effect.void);
        } else {
          console.log("Install process failed with code:", code);
          resume(Effect.fail(new ChildProcessError()));
        }
      });

      installChild.on("error", (error) => {
        console.log("Install process error:", error);
        resume(Effect.fail(new ChildProcessError()));
      });
    });

    console.log("projects after install", yield* getLines);
    // console.log("spawning at", assignedPort);

    // Use our wrapper script that can accept the marker argument
    const wrapperPath =
      "/Users/robby/zenbu/packages/zenbu-daemon/src/vite-wrapper.js";
    const child = spawn(
      "node",
      [wrapperPath, "--marker", title, "--port", assignedPort.toString()],
      {
        cwd: actualCodePath,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
        env: {
          ...process.env,
        },
      }
    );

    yield* Effect.async<void, ChildProcessError>((resume) => {
      child.on("spawn", () => {
        if (child.pid) {
          child.pid;
          // process.title = title;
        }
        resume(Effect.void);
      });

      child.on("error", (error) => {
        resume(Effect.fail(new ChildProcessError()));
      });
    });

    /**
     * 
     * 
projects after install {
  stdout: '61040 zenbu-daemon:project=clever-cloud-311:assigned_port=61935:created_at=1749167812963     \n',
  stderr: ''
}
projects after spawn {
  stdout: '61040 zenbu-daemon:project=cosmic-dragon-668:assigned_port=62486:created_at=1749169741827     \n',
  stderr: ''
}


why the fuck is spawning another vite server killing the original???????


     */

    child.stdout?.on("data", (data) => {
      console.log(`Project ${name} stdout:`, data.toString());
    });

    child.stderr?.on("data", (data) => {
      console.log(`Project ${name} stderr:`, data.toString());
    });

    child.on("error", (error) => {
      console.log("Child process error:", error);
    });

    child.on("close", () => {
      console.log("closing", name);
    });

    const pid = child.pid;
    // child.
    // console.log("pid we got back", pid);

    if (!pid) {
      return yield* new ChildProcessError();
    }

    // const text = yield* Effect.tryPromise(() =>
    //   fetch(`http://localhost:${assignedPort}`)
    // );
    // console.log("fuck", text);

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
)<{ meta: unknown }> {}
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
    yield* client.effect.set(name, {
      kind: "status",
      status: "running",
    });
  });

const parseProcessMarkerArgument = (processTitle: string) =>
  Effect.gen(function* () {
    const match = processTitle.match(
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

const spawnProject = ({ pathToSymlinkAt }: { pathToSymlinkAt: string }) =>
  Effect.gen(function* () {
    console.log("projects a", yield* getProjects);

    const { name, createdAt } = yield* createProject;
    console.log("created", name);
    console.log("projects b", yield* getProjects);

    // console.log("creating project", name);

    const project = yield* runProject({
      name,
      createdAt,
    });

    yield* publishStartedProject(name);
    console.log("projects c", yield* getProjects);
    const { client } = yield* RedisContext;

    const fs = yield* FileSystem.FileSystem;
    yield* fs.makeDirectory(`${pathToSymlinkAt}/zenbu-links`, {
      recursive: true,
    });
    const projectLinkDir = `${pathToSymlinkAt}/zenbu-links/${project.name}`;

    const absoluteProjectPath = yield* fs.realPath(project.cwd);

    yield* fs.symlink(absoluteProjectPath, projectLinkDir).pipe(
      Effect.match({
        onFailure: (e) => {
          // console.log("fail", e);
        },
        onSuccess: (d) => {
          // console.log("succes", d);
        },
      })
    );

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
    console.log("killing", name);

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

export type DaemonAppType = Awaited<ReturnType<typeof createServer>>["app"];
