import { Effect, Context } from "effect";

import { Hono } from "hono";

import { cors } from "hono/cors";

import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { spawn } from "child_process";

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

/**
 *
 * okay was worth a shot to see o3 could one shot this, but apparently not it doesn't know the API's (I have a feeling it can do it since everything is quite modular?)
 */

export const UserContext = Context.GenericTag<User>("UserContext");

const createProject = Effect.gen(function* () {
  return "i guess a path?";
});

const runProject = (projectPath: string) =>
  Effect.gen(function* () {
    // todo: just a stub for now, impl later
    // need to make sure to give the process a title for metadata so we can search in the future
    const process = spawn("pnpm run dev");

    return process;
  });

type EffectReturnType<T> =
  T extends Effect.Effect<infer R, never, never> ? R : never;

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

const spawnProject = Effect.gen(function* () {
  const projectPath = yield* createProject;
  const serverProcess = yield* runProject(projectPath);
  const serverInfo = yield* publishStartedProject(serverProcess); // do we want to do this, or just alert some reactive process manager that it needs to re-derive
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
   * will need to make sure to do that in  parallel
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
