import { Effect, Context, Data } from "effect";

import { Option } from "effect";
import path from "node:path";
import { Hono } from "hono";

import { cors } from "hono/cors";

import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { spawn } from "child_process";
import getPort from "get-port";
import { makeRedisClient } from "zenbu-redis";

const redisClient = makeRedisClient();

const PROJECTS_DIR = path.resolve(process.cwd(), "projects");
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

export const createServer = () => {
  const app = new Hono()
    .use("*", cors())
    .post("/create-project", async (opts) => {
      const runtimeUser = { id: "abc", name: "Alice" };

      await Effect.runPromise(
        program.pipe(Effect.provideService(UserContext, runtimeUser))
      );
    });
};

const program = Effect.gen(function* (_) {
  const user = yield* _(UserContext);

  const anotherUser = yield* programTwo;
});

const programTwo = Effect.gen(function* (_) {
  const user = yield* _(UserContext);
  return user;
});
export interface User {
  id: string;
  name: string;
}
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

export const UserContext = Context.GenericTag<User>("UserContext");

const createProject = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const name = generateRandomName();
  const projectPath = `projects/${name}`;
  yield* fs.makeDirectory(projectPath);
  yield* fs.copy("templates/node-project", projectPath);
  return { name, projectPath };
});

const runProject = ({
  projectPath,
  name,
}: {
  projectPath: string;
  name: string;
}) =>
  Effect.gen(function* () {
    // todo: just a stub for now, impl later
    // need to make sure to give the process a title for metadata so we can search in the future

    const assignedPort = yield* Effect.tryPromise(() => getPort());

    /**
     * whats the dir?
     * projects/<name>/node-project?
     */

    // todo: don't hard code node-project, or forward slashes for directories
    const fs = yield* FileSystem.FileSystem;
    const actualCodePath = `projects/${name}/node-project`;

    const exists = yield* fs.exists(actualCodePath);

    if (exists) {
      yield* new GenericError();
    }

    const markerArgument = getProcessTitleMarker(name, assignedPort);
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

    return {
      pid,
      assignedPort,
    };
  });

type EffectReturnType<T> =
  T extends Effect.Effect<infer R, any, any> ? R : never;

const start = (pid: number) => {};
const pause = (pid: number) => {};
const resume = (path: string) => {};
// i guess killing is pausing? But there could be a semantic difference? right yes u should be able to pause a process without killing it
const kill = (pid: number) => {};

/**
 *  we will want some process manager with stop/start/resume/pause
 *
 *
 * or we can just make it functions that are called on data, that makes is serializable too which is quite nice
 *
 *
 */
export class GenericError extends Data.TaggedError("GenericError")<{}> {}
export class ChildProcessError extends Data.TaggedError(
  "ChildProcessError"
)<{}> {}

function unreachable(x: never): never {
  throw new Error(`This code should be unreachable, but got: ${x}`);
}

type ServerInfo = {
  pid: number;
  cwd: string;
  port: number;
};
const publishStartedProject = (
  process: EffectReturnType<ReturnType<typeof runProject>>
) =>
  Effect.gen(function* () {
    return null as unknown as ServerInfo;
  });

// will have to use this when i read everything
const parseProcessMarkerArgument = (markerArgument: string) =>
  Effect.gen(function* () {
    const match = markerArgument.match(
      /zenbu-daemon:project=(.+):assigned_port=(\d+)/
    );
    if (!match) {
      yield* new GenericError();
      return;
    }
    const port = parseInt(match[2], 10);
  });
const getProcessTitleMarker = (name: string, port: number): string => {
  return `zenbu-daemon:project=${name}:assigned_port=${port}`;
};

const spawnProject = Effect.gen(function* () {
  const { name, projectPath } = yield* createProject;
  const { assignedPort, pid } = yield* runProject({
    name,
    projectPath,
  });

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
  const serverInfo = yield* publishStartedProject({ assignedPort, pid });
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