import { serve } from "@hono/node-server";
import { Env, Hono, MiddlewareHandler, type Context } from "hono";
import { type Server as HttpServer, type Server } from "node:http";
import { spawn, exec } from "node:child_process";
import type {
  ChildProcessByStdio,
  ChildProcessWithoutNullStreams,
} from "node:child_process";
import { mkdir, rm, access, readFile } from "node:fs/promises";
import path from "node:path";
import getPort, { portNumbers } from "get-port";
import extract from "extract-zip";
import * as util from "node:util";
import assert from "node:assert/strict";
import type { Readable } from "node:stream";
import { validator } from "hono/validator";
import { cors } from "hono/cors";
import pidusage from "pidusage";
import { trpc } from "./trpc.js";
import { injectWebSocket } from "./inject-websocket.js";

const processStdoutMap = new Map<number, string[]>();

// don't share shim with plugin it breaks types for some reason, i think Env gets resolved differently per project for some reason i can't figure it out
// okay figured ito ut its because type paths need to remove those or fix it at the config level however u would do that

const shim = <T>(): MiddlewareHandler<
  Env,
  string,
  { in: { json: T }; out: { json: T } }
> => {
  return validator("json", async (value, c) => {
    const data = value as T;
    return data;
  });
};

type Ok<T> = { kind: "ok"; value: T };
type Err<E> = { kind: "error"; error: E };
type Result<T, E = string> = Ok<T> | Err<E>;

const ok = <T, E = string>(value: T): Ok<T> => ({ kind: "ok", value });
const err = <T, E = string>(error: E): Err<E> => ({ kind: "error", error });

const iife = <T>(f: () => T): T => f();

const ZIP_NAME = "node.zip";
const NESTED_TEMPLATE_DIR_NAME = "node-test";
const RUN_SERVER_COMMAND = ["node", "index.js"];

const TEMPLATE_DIR = path.resolve(process.cwd(), "templates");
const TEMPLATE_ZIP_PATH = path.join(TEMPLATE_DIR, ZIP_NAME);
const PROJECTS_DIR = path.resolve(process.cwd(), "projects");
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const NEW_INDEX_HTML_PATH = path.join(PUBLIC_DIR, "index.html");
const FAVICON_PATH = path.join(PUBLIC_DIR, "favicon.ico");

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

const MAX_PROJECT_NAME_GENERATION_ATTEMPTS = 15;
const SHUTDOWN_SIGNAL_TIMEOUT_MS = 500;
const SHUTDOWN_KILL_TIMEOUT_MS = 200;

interface ProjectProcessInfo {
  pid: number;
  name: string;
  port: number;
  cwd: string;
  stdout?: string[];
}

type ParsedMarker = Omit<ProjectProcessInfo, "cwd" | "pid">;

type SpawnedProcess = ChildProcessByStdio<null, Readable, Readable>;

const activeProjectNames = new Set<string>();
let ensuringWarmInstance = false;
let isShuttingDown = false;

const logPrefix = {
  daemon: "[Daemon]",
  project: (name: string) => `[Project:${name}]`,
  process: (name: string, pid?: number) =>
    `[Process:${name}${pid ? `:${pid}` : ""}]`,
};

function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${suffix}`;
}

/**
 * we may need to set this up so you can tag it with an experiment?
 * or maybe that's not an interesting distinction? You just tag it with metadata on the frontend as a foreign key (normalize the name)
 * yeah okay so then highest alpha is setting up a db to manage shit with
 * I think we just manage everything sensibly and not scope a local db (scope of the project has increased quite a bit)
 * but we should probably support project scoped db's? Maybe?
 *
 * also todo I need to make a lil file explorer impl to find projects to start on
 *
 * some validation after selecting them and how to get them setup (perhaps we automatically run a script on the project to set it up/ have a model transform it)
 * would be cool if we could have a "migrate to" to make it work
 *
 *
 * IOS devs do not have their devtools embedded into the app itself, that is potentially a bad constraint to have
 */
const getProcessTitleMarker = (
  name: string,
  port: number,
  pid: number | string
): string => {
  return `zenbu-daemon:project=${name}:assigned_port=${port}:pid=${pid}`;
};

function parseProcessMarkerArgument(
  markerArgument: string
): Result<ParsedMarker> {
  const match = markerArgument.match(
    /zenbu-daemon:project=(.+):assigned_port=(\d+):pid=(.+)/
  );
  if (!match) {
    return err(`Could not parse marker argument format: ${markerArgument}`);
  }
  const port = parseInt(match[2], 10);
  if (isNaN(port)) {
    return err(`Invalid port number parsed from marker: ${match[2]}`);
  }
  return ok({ name: match[1], port });
}

const execPromise = util.promisify(exec);

async function safeAccess(
  filePath: string,
  mode?: number
): Promise<Result<void>> {
  try {
    await access(filePath, mode);
    return ok(undefined);
  } catch (e: unknown) {
    return err(
      `Access failed for '${filePath}': ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

async function safeMkdir(
  dirPath: string,
  options?: { recursive?: boolean }
): Promise<Result<void>> {
  try {
    await mkdir(dirPath, options);
    console.log(`${logPrefix.daemon} Ensured directory exists: ${dirPath}`);
    return ok(undefined);
  } catch (e: unknown) {
    if (e instanceof Error && "code" in e && e.code === "EEXIST") {
      console.log(
        `${logPrefix.daemon} Directory already exists (ignored): ${dirPath}`
      );
      return ok(undefined);
    }
    return err(
      `Failed to create directory '${dirPath}': ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

async function safeRm(
  targetPath: string,
  options?: { recursive?: boolean; force?: boolean }
): Promise<Result<void>> {
  try {
    await rm(targetPath, options);
    return ok(undefined);
  } catch (e: unknown) {
    if (
      options?.force &&
      e instanceof Error &&
      "code" in e &&
      e.code === "ENOENT"
    ) {
      return ok(undefined);
    }
    return err(
      `Failed to remove '${targetPath}': ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

async function safeExtract(
  zipPath: string,
  targetDir: string
): Promise<Result<void>> {
  try {
    await extract(zipPath, { dir: targetDir });
    return ok(undefined);
  } catch (e: unknown) {
    return err(
      `Failed to extract '${zipPath}' to '${targetDir}': ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

async function safeGetPort(options?: any): Promise<Result<number>> {
  try {
    const port = await getPort(options);
    return ok(port);
  } catch (e: unknown) {
    return err(
      `Failed to get available port: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

async function safeReadFile(
  filePath: string,
  encoding?: BufferEncoding | null
): Promise<Result<string | Buffer>> {
  const effectiveEncoding = encoding === null ? undefined : encoding;
  try {
    const content = await readFile(filePath, effectiveEncoding);
    return ok(content);
  } catch (e: unknown) {
    return err(
      `Failed to read file '${filePath}': ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

async function safeExec(
  command: string
): Promise<Result<{ stdout: string; stderr: string }>> {
  try {
    const result = await execPromise(command);
    return ok(result);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "stdout" in error &&
      "stderr" in error &&
      "code" in error
    ) {
      if (
        error.code === 1 &&
        (error as any).stderr === "" &&
        command.includes("grep")
      ) {
        return ok({ stdout: "", stderr: "" });
      }
      return err(
        `Command failed (code ${error.code}): ${command}\nStderr: ${error.stderr}\nStdout: ${error.stdout}\nError: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return err(
      `Command failed: ${command}\nError: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function safeSpawn(
  command: string,
  args: string[],
  options: any
): Result<{ child: ChildProcessWithoutNullStreams; pid: number }> {
  try {
    const child = spawn(command, args, options);
    const pid = child.pid;

    if (pid === undefined) {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      return err("Failed to obtain PID immediately after spawning process.");
    }

    processStdoutMap.set(pid, []);

    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      const currentStdout = processStdoutMap.get(pid) || [];
      currentStdout.push(...lines);
      if (currentStdout.length > 1000) {
        currentStdout.splice(0, currentStdout.length - 1000);
      }
      processStdoutMap.set(pid, currentStdout);
    });

    child.on("exit", () => {
      processStdoutMap.delete(pid);
    });

    return ok({ child, pid });
  } catch (spawnError: unknown) {
    return err(
      `Process spawn failed: ${spawnError instanceof Error ? spawnError.message : String(spawnError)}`
    );
  }
}

async function getRunningProjects(): Promise<Result<ProjectProcessInfo[]>> {
  const command = `ps -o pid,command -ax | grep 'zenbu-daemon:project=' | grep -v grep`;
  const execResult = await safeExec(command);

  switch (execResult.kind) {
    case "error": {
      console.error(
        `${logPrefix.daemon} Error listing processes: ${execResult.error}`
      );
      return err(`Failed to list processes.`);
    }

    case "ok":
      const { stdout } = execResult.value;
      if (!stdout) {
        console.log(
          `${logPrefix.daemon} No running project processes found via ps.`
        );
        return ok([]);
      }

      const lines = stdout.trim().split("\n");
      const projects: ProjectProcessInfo[] = [];

      for (const line of lines) {
        if (!line) continue;
        const psPidMatch = line.trim().match(/^(\d+)\s+/);
        if (!psPidMatch) {
          console.warn(
            `${logPrefix.daemon} Could not extract PID from ps line: ${line}`
          );
          continue;
        }
        const pid = parseInt(psPidMatch[1], 10);
        if (isNaN(pid)) {
          console.warn(
            `${logPrefix.daemon} Invalid PID parsed from ps line: ${line}`
          );
          continue;
        }

        const markerIndex = line.indexOf("zenbu-daemon:project=");
        if (markerIndex === -1) {
          console.warn(
            `${logPrefix.daemon} Could not find marker argument in ps line for PID ${pid}: ${line}`
          );
          continue;
        }

        const markerArgument = line.slice(markerIndex);
        const parsedDetailsResult = parseProcessMarkerArgument(markerArgument);

        switch (parsedDetailsResult.kind) {
          case "error":
            console.warn(`${logPrefix.daemon} ${parsedDetailsResult.error}`);
            continue;
          case "ok":
            const { name, port } = parsedDetailsResult.value;
            const HACK_PROJECT_PATH_FIX_ME_ASAP_THIS_SHOULD_NOT_BE_KEPT_I_THINK =
              name + "/" + NESTED_TEMPLATE_DIR_NAME;
            const projectPath = path.join(
              PROJECTS_DIR,
              HACK_PROJECT_PATH_FIX_ME_ASAP_THIS_SHOULD_NOT_BE_KEPT_I_THINK
            );

            const stdout = processStdoutMap.get(pid) || [];

            projects.push({ pid, name, port, cwd: projectPath, stdout });
        }
      }

      console.log(
        `${logPrefix.daemon} Found ${projects.length} running project processes.`
      );
      return ok(projects);
  }
}

function findWarmInstance(
  runningProjects: ProjectProcessInfo[],
  activeNames: Set<string>
): ProjectProcessInfo | null {
  const warmInstance = runningProjects.find((p) => !activeNames.has(p.name));
  if (warmInstance) {
    console.log(
      `${logPrefix.daemon} Found available warm instance: ${warmInstance.name}`
    );
    return warmInstance;
  }
  return null;
}

async function startDevServer(
  name: string
): Promise<Result<ProjectProcessInfo>> {
  assert(name.length > 0, "startDevServer requires a valid name");

  const projectPath = path.join(PROJECTS_DIR, name);
  const actualCodePath = path.join(projectPath, NESTED_TEMPLATE_DIR_NAME);
  const projLog = logPrefix.project(name);

  console.log(`${projLog} Starting server... (Base: ${projectPath})`);

  const mkdirRes = await safeMkdir(projectPath, { recursive: true });
  if (mkdirRes.kind === "error") return mkdirRes;

  const extractRes = await safeExtract(TEMPLATE_ZIP_PATH, projectPath);
  if (extractRes.kind === "error") {
    await safeRm(projectPath, { recursive: true, force: true });
    return extractRes;
  }

  const packageJsonPath = path.join(actualCodePath, "package.json");
  const entryFilePath = path.join(actualCodePath, RUN_SERVER_COMMAND[1]);
  const accessPkgJsonRes = await safeAccess(packageJsonPath);
  const accessEntryFileRes = await safeAccess(entryFilePath);

  if (
    accessPkgJsonRes.kind === "error" ||
    accessEntryFileRes.kind === "error"
  ) {
    const missing =
      accessPkgJsonRes.kind === "error" ? packageJsonPath : entryFilePath;
    const errorMsg = `${projLog} !!! ERROR: Required file NOT FOUND in ${NESTED_TEMPLATE_DIR_NAME} after unzip. Check zip/config. Missing: ${missing}`;
    console.error(errorMsg);
    await safeRm(projectPath, { recursive: true, force: true });
    return err(
      `Template setup error: Missing required file (${path.basename(missing)})`
    );
  }
  console.log(`${projLog} Verified required files in ${actualCodePath}`);

  console.log(`${projLog} Skipping 'pnpm install' step.`);

  const portRes = await safeGetPort();
  if (portRes.kind === "error") {
    await safeRm(projectPath, { recursive: true, force: true });
    return portRes;
  }
  const assignedPort = portRes.value;
  console.log(`${projLog} ---> Assigned port: ${assignedPort}`);

  const command = RUN_SERVER_COMMAND[0];
  const markerArgument = getProcessTitleMarker(name, assignedPort, "PENDING");
  const args = [...RUN_SERVER_COMMAND.slice(1), markerArgument];

  console.log(
    `${projLog} Spawning: ${command} ${args.join(" ")} (cwd: ${actualCodePath}, PORT: ${assignedPort})`
  );

  const spawnRes = safeSpawn(command, args, {
    cwd: actualCodePath,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, PORT: assignedPort.toString() },
  });

  if (spawnRes.kind === "error") {
    console.error(`${projLog} !!! ERROR Spawning process: ${spawnRes.error}`);
    await safeRm(projectPath, { recursive: true, force: true });
    return spawnRes;
  }

  const { child, pid: processPid } = spawnRes.value;
  const procLog = logPrefix.process(name, processPid);
  console.log(`${procLog} ---> Launched PID ${processPid}. Detaching.`);
  child.unref();

  child.stdout.on("data", (data) =>
    data
      .toString()
      .trim()
      .split("\n")
      .forEach((line: string) => console.log(`${procLog} stdout: ${line}`))
  );
  child.stderr.on("data", (data) =>
    data
      .toString()
      .trim()
      .split("\n")
      .forEach((line: string) => console.error(`${procLog} stderr: ${line}`))
  );
  child.on("error", (err) =>
    console.error(`${procLog} error: Subprocess error: ${err.message}`)
  );
  child.on("close", (code) => {
    console.log(`${procLog} close: Process exited with code ${code}`);
    const wasActive = activeProjectNames.delete(name);
    if (wasActive) {
      console.log(`${procLog} Active project died. Removed from active set.`);
    } else {
      console.log(`${procLog} Non-active (likely warm) instance died.`);
    }
    setImmediate(ensureWarmInstance);
  });

  console.log(`${projLog} Server start initiated successfully.`);
  return ok({ pid: processPid, name, port: assignedPort, cwd: projectPath });
}

async function killProcess(pid: number, name: string): Promise<Result<void>> {
  const procLog = logPrefix.process(name, pid);
  let killed = false;
  try {
    process.kill(pid, "SIGTERM");
    console.log(`${procLog} ---> Sent SIGTERM.`);
    killed = true;
    await new Promise((resolve) =>
      setTimeout(resolve, SHUTDOWN_SIGNAL_TIMEOUT_MS)
    );
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") {
      console.warn(`${procLog} Process ${pid} not found (already dead?).`);
      return ok(undefined);
    } else {
      console.error(
        `${procLog} Error sending SIGTERM: ${error instanceof Error ? error.message : String(error)}.`
      );
    }
  }

  if (!killed) {
    try {
      console.log(
        `${procLog} Process ${pid} might still be running or SIGTERM failed. Trying SIGKILL.`
      );
      process.kill(pid, "SIGKILL");
      console.log(`${procLog} ---> Sent SIGKILL.`);
      await new Promise((resolve) =>
        setTimeout(resolve, SHUTDOWN_KILL_TIMEOUT_MS)
      );
      return ok(undefined);
    } catch (killError: unknown) {
      if (
        killError instanceof Error &&
        "code" in killError &&
        killError.code === "ESRCH"
      ) {
        console.warn(
          `${procLog} Process ${pid} not found during SIGKILL (likely died between signals?).`
        );
        return ok(undefined);
      } else {
        console.error(
          `${procLog} !!! SIGKILL error for PID ${pid}: ${killError instanceof Error ? killError.message : String(killError)}`
        );
        return err(
          `Failed to kill process ${pid} (SIGKILL error: ${killError instanceof Error ? killError.message : String(killError)})`
        );
      }
    }
  }

  return ok(undefined);
}

async function killProjectProcess(
  pid: number,
  projectPath: string,
  name: string
): Promise<Result<void>> {
  assert(
    typeof pid === "number" && pid > 0,
    "killProjectProcess requires a valid PID"
  );
  assert(
    typeof projectPath === "string" && projectPath.length > 0,
    "killProjectProcess requires a projectPath"
  );
  assert(
    typeof name === "string" && name.length > 0,
    "killProjectProcess requires a name"
  );

  const projLog = logPrefix.project(name);
  console.log(
    `${projLog} Attempting to kill process ${pid} and remove directory ${projectPath}`
  );

  const killRes = await killProcess(pid, name);
  const rmResult = await safeRm(projectPath, { recursive: true, force: true });

  if (killRes.kind === "error") {
    if (rmResult.kind === "error") {
      console.error(
        `${projLog} Additionally failed cleanup of ${projectPath}: ${rmResult.error}`
      );
    }
    return killRes;
  }

  if (rmResult.kind === "error") {
    console.error(
      `${projLog} !!! ERROR removing directory ${projectPath}: ${rmResult.error}`
    );
    return err(
      `Process ${pid} killed, but failed to remove directory ${projectPath}: ${rmResult.error}`
    );
  }

  console.log(
    `${projLog} ---> Process ${pid} terminated and directory ${projectPath} removed.`
  );
  return ok(undefined);
}

async function assignProjectInstance(): Promise<Result<ProjectProcessInfo>> {
  const runningProjectsResult = await getRunningProjects();
  const runningProjects = iife(() => {
    switch (runningProjectsResult.kind) {
      case "error":
        return runningProjectsResult;
      case "ok":
        return runningProjectsResult.value;
    }
  });
  // what the hell is gemini writing
  if (!Array.isArray(runningProjects)) return runningProjects as Err<string>;

  const warmInstance = findWarmInstance(runningProjects, activeProjectNames);

  if (warmInstance) {
    console.log(
      `${logPrefix.daemon} Using warm instance: ${warmInstance.name} (PID: ${warmInstance.pid})`
    );
    activeProjectNames.add(warmInstance.name);
    setImmediate(ensureWarmInstance);
    return ok(warmInstance);
  }

  console.log(
    `${logPrefix.daemon} No warm instance available. Creating new project from scratch...`
  );
  let newProjectName = "";
  let attempts = 0;
  let nameIsUnique = false;
  while (attempts < MAX_PROJECT_NAME_GENERATION_ATTEMPTS && !nameIsUnique) {
    newProjectName = generateRandomName();
    nameIsUnique =
      !runningProjects.some((p) => p.name === newProjectName) &&
      !activeProjectNames.has(newProjectName);
    attempts++;
  }

  if (!nameIsUnique) {
    return err(
      `Failed to generate a unique project name after ${attempts} attempts.`
    );
  }

  console.log(`${logPrefix.daemon} Generated unique name: ${newProjectName}`);
  const startResult = await startDevServer(newProjectName);
  // for some reason the drizzle types on the output can't be inferred through project boundary, ugh
  // name:id 1:1 mapping for now,

  switch (startResult.kind) {
    case "error": {
      return err(
        `Failed to start new server '${newProjectName}': ${startResult.error}`
      );
    }
    case "ok": {
      // don't block on failed backend creation, but should do roll back on fail (its an optimistic mutation)
      console.log("goo goo");

      const res = await trpc.project.createProject.mutate({
        name: newProjectName,
      });

      console.log("the res", res);

      const newProjectInfo = startResult.value;
      activeProjectNames.add(newProjectName);
      setImmediate(ensureWarmInstance);
      return ok(newProjectInfo);
    }
  }
}

async function ensureWarmInstance() {
  if (ensuringWarmInstance || isShuttingDown) return;
  ensuringWarmInstance = true;
  console.log(`${logPrefix.daemon} Checking warm instance status...`);

  try {
    const runningProjectsResult = await getRunningProjects();
    if (runningProjectsResult.kind === "error") {
      console.error(
        `${logPrefix.daemon} Error getting running projects during warm check: ${runningProjectsResult.error}`
      );
      ensuringWarmInstance = false;
      return;
    }
    const runningProjects = runningProjectsResult.value;

    const warmInstanceExists = runningProjects.some(
      (p) => !activeProjectNames.has(p.name)
    );

    if (warmInstanceExists) {
      console.log(`${logPrefix.daemon} Warm instance available.`);
      ensuringWarmInstance = false;
      return;
    }

    console.log(`${logPrefix.daemon} No warm instance found. Starting one...`);
    let warmName = "";
    let attempts = 0;
    let nameIsUnique = false;
    while (attempts < MAX_PROJECT_NAME_GENERATION_ATTEMPTS && !nameIsUnique) {
      warmName = generateRandomName();
      nameIsUnique =
        !runningProjects.some((p) => p.name === warmName) &&
        !activeProjectNames.has(warmName);
      attempts++;
    }

    if (!nameIsUnique) {
      console.error(
        `${logPrefix.daemon} !!! Failed to generate a unique name for warm instance after ${attempts} attempts.`
      );
      ensuringWarmInstance = false;
      return;
    }

    console.log(
      `${logPrefix.daemon} Generated unique name for warm instance: ${warmName}`
    );
    const startResult = await startDevServer(warmName);

    console.log("making it fr");

    const res = await trpc.project.createProject
      .mutate({
        name: warmName,
      })
      .catch((e) => {
        console.log("did i error?", e);
      });

    console.log("the res");

    switch (startResult.kind) {
      case "error":
        console.error(
          `${logPrefix.daemon} !!! Failed to start warm instance '${warmName}': ${startResult.error}`
        );
        break;
      case "ok":
        console.log(
          `${logPrefix.daemon} ---> Started new warm instance: ${warmName} (PID: ${startResult.value.pid})`
        );
        break;
    }
  } catch (error: unknown) {
    console.error(
      `${logPrefix.daemon} Unexpected error during warm instance check:`,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    ensuringWarmInstance = false;
  }
}

async function cleanupProcesses(): Promise<void> {
  console.log(
    `\n${logPrefix.daemon} Shutting down... Cleaning up running projects.`
  );
  const projectsResult = await getRunningProjects();

  switch (projectsResult.kind) {
    case "error":
      console.error(
        `${logPrefix.daemon} Failed to get project list during shutdown: ${projectsResult.error}. Cleanup may be incomplete.`
      );
      return;
    case "ok":
      if (projectsResult.value.length === 0) {
        console.log(
          `${logPrefix.daemon} No running project processes found to clean up.`
        );
        return;
      }

      const projects = projectsResult.value;
      console.log(
        `${logPrefix.daemon} Found ${projects.length} processes to terminate.`
      );
      const killPromises = projects.map((p) => {
        console.log(
          `${logPrefix.daemon} Adding process ${p.name} (PID: ${p.pid}) to cleanup queue.`
        );
        return killProjectProcess(p.pid, p.cwd, p.name);
      });

      const results = await Promise.allSettled(killPromises);
      results.forEach((settledResult, index) => {
        const projectName = projects[index]?.name || `index ${index}`;
        if (settledResult.status === "rejected") {
          console.error(
            `${logPrefix.daemon} Unexpected rejection cleaning up project ${projectName}:`,
            settledResult.reason
          );
        } else {
          const killRes = settledResult.value;
          if (killRes.kind === "error") {
            console.error(
              `${logPrefix.daemon} Failed cleanup for project ${projectName}: ${killRes.error}`
            );
          }
        }
      });

      console.log(`${logPrefix.daemon} Process cleanup finished.`);
  }
}

async function initialize(): Promise<Result<number>> {
  console.log(`${logPrefix.daemon} Initializing daemon...`);

  const projectsDirResult = await safeMkdir(PROJECTS_DIR, { recursive: true });
  if (projectsDirResult.kind === "error")
    return err(`Initialization failed: ${projectsDirResult.error}`);
  const templateDirResult = await safeMkdir(TEMPLATE_DIR, { recursive: true });
  if (templateDirResult.kind === "error")
    return err(`Initialization failed: ${templateDirResult.error}`);
  const publicDirResult = await safeMkdir(PUBLIC_DIR, { recursive: true });
  if (publicDirResult.kind === "error")
    return err(`Initialization failed: ${publicDirResult.error}`);

  console.log(`${logPrefix.daemon} Project directory: ${PROJECTS_DIR}`);
  console.log(`${logPrefix.daemon} Template directory: ${TEMPLATE_DIR}`);
  console.log(`${logPrefix.daemon} Public directory (for UI): ${PUBLIC_DIR}`);

  console.log(
    `${logPrefix.daemon} Checking for template zip at: ${TEMPLATE_ZIP_PATH}`
  );
  const zipAccessResult = await safeAccess(TEMPLATE_ZIP_PATH, 4);
  if (zipAccessResult.kind === "error") {
    return err(
      `Template zip '${ZIP_NAME}' not found/readable at ${TEMPLATE_ZIP_PATH}: ${zipAccessResult.error}`
    );
  }
  console.log(`${logPrefix.daemon} ---> Template zip found.`);

  console.log(`${logPrefix.daemon} Performing initial cleanup...`);
  await cleanupProcesses();
  activeProjectNames.clear();
  console.log(`${logPrefix.daemon} Initial cleanup finished.`);

  // starts at 40_000 unless conflict, so something at 40_000 always running
  const portResult = await safeGetPort({ port: portNumbers(40000, 41000) });
  if (portResult.kind === "error") {
    return err(`Failed to get daemon port: ${portResult.error}`);
  }
  const daemonPort = portResult.value;
  console.log(`${logPrefix.daemon} ---> Using port for daemon: ${daemonPort}`);

  ensureWarmInstance();

  return ok(daemonPort);
}

async function runInitializeAndServe(app: Hono) {
  const initResult = await initialize();

  switch (initResult.kind) {
    case "error": {
      return;
    }

    case "ok":
      {
        const port = initResult.value;
        const hostname = "localhost";
        const $server = serve(
          { fetch: app.fetch, port, hostname }
          // (info) => {
          //   const address =
          //     info.address === "::" || info.address === "0.0.0.0"
          //       ? "localhost"
          //       : info.address;
          //   const daemonUrl = `http://${address}:${info.port}`;
          //   console.log(
          //     `${logPrefix.daemon} ---> Daemon server listening on ${daemonUrl}`
          //   );
          //   console.log(
          //     `${logPrefix.daemon} ---> Frontend UI accessible at: ${daemonUrl}/`
          //   );
          // }
        );

        const server = $server.listen(port, hostname);
        injectWebSocket(server as HttpServer);
      }

      break;
  }
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(
    `\n${logPrefix.daemon} Received ${signal}. Starting graceful shutdown...`
  );
  await cleanupProcesses();
  console.log(`${logPrefix.daemon} Shutdown complete. Exiting.`);
  process.exit(0);
}

export const createDaemon = () => {
  const app = new Hono();
  app.use("*", cors());
  const route = app

    .get("/", async (c) => {
      console.log(`${logPrefix.daemon} Request received for / (serving UI)`);
      const htmlResult = await safeReadFile(NEW_INDEX_HTML_PATH, "utf-8");

      switch (htmlResult.kind) {
        case "error":
          console.error(
            `${logPrefix.daemon} !!! ERROR reading or serving ${NEW_INDEX_HTML_PATH}: ${htmlResult.error}`
          );
          c.status(500);
          return c.text("Internal Server Error: Could not load UI.");
        case "ok":
          console.log(
            `${logPrefix.daemon} Successfully read ${path.basename(NEW_INDEX_HTML_PATH)}. Serving...`
          );
          c.header("Content-Type", "text/html; charset=utf-8");
          return c.body(htmlResult.value);
      }
    })
    .get("/favicon.ico", async (c) => {
      const iconResult = await safeReadFile(FAVICON_PATH, null);

      switch (iconResult.kind) {
        case "error":
          console.warn(
            `${logPrefix.daemon} Favicon request failed: ${iconResult.error}`
          );
          c.status(404);
          return c.text("Not Found");
        case "ok":
          c.header("Content-Type", "image/x-icon");
          return c.body(iconResult.value);
      }
    })
    .get("/projects/:name/stats", async (c) => {
      const name = c.req.param("name");
      const projLog = logPrefix.project(name);
      console.log(`${projLog} API Request: GET /projects/${name}/stats`);

      const projectsResult = await getRunningProjects();

      switch (projectsResult.kind) {
        case "error":
          console.error(
            `${projLog} Error fetching running projects: ${projectsResult.error}`
          );
          return c.json({ error: "Failed to retrieve projects list" }, 500);

        case "ok":
          const project = projectsResult.value.find((p) => p.name === name);
          if (!project) {
            console.warn(`${projLog} Project not found in running processes`);
            return c.json({ error: `Project '${name}' not found` }, 404);
          }

          try {
            const stats = await pidusage(project.pid);

            const result = {
              pid: project.pid,
              name: project.name,
              stats: {
                cpu: stats.cpu,
                memory: stats.memory,
                ppid: stats.ppid,
                elapsed: stats.elapsed,
                timestamp: Date.now(),
              },
              stdout: project.stdout || [],
            };

            console.log(
              `${projLog} Stats retrieved successfully for PID ${project.pid}`
            );
            return c.json(result);
          } catch (error) {
            console.error(
              `${projLog} Error getting process stats: ${error instanceof Error ? error.message : String(error)}`
            );
            return c.json(
              { error: `Failed to get stats for project '${name}'` },
              500
            );
          }
      }
    })
    .get("/projects", async (c) => {
      console.log(`${logPrefix.daemon} API Request: GET /projects`);
      const projectsResult = await getRunningProjects();

      switch (projectsResult.kind) {
        case "error":
          console.error(
            `${logPrefix.daemon} API /projects GET Error: ${projectsResult.error}`
          );
          return c.json({ error: "Failed to retrieve project list" }, 500);
        case "ok":
          const activeProjects = projectsResult.value.filter((p) =>
            activeProjectNames.has(p.name)
          );
          const responseData = activeProjects.map(
            ({ name, port, pid, cwd }) => ({
              name,
              port,
              pid,
              cwd,
            })
          );
          return c.json(responseData);
      }
    })
    .post("/projects", async (c) => {
      console.log(`${logPrefix.daemon} API Request: POST /projects`);
      const startTime = Date.now();
      const assignResult = await assignProjectInstance();

      switch (assignResult.kind) {
        case "error":
          console.error(
            `${logPrefix.daemon} !!! Error assigning/creating project: ${assignResult.error}`
          );
          return c.json(
            {
              error: `Failed to prepare project. Reason: ${assignResult.error}`,
            },
            500
          );
        case "ok":
          const newProjectInfo = assignResult.value;
          const endTime = Date.now();
          console.log(
            `${logPrefix.project(newProjectInfo.name)} ---> Project assigned/created successfully in ${endTime - startTime}ms.`
          );
          return c.json(
            {
              message: `Project '${newProjectInfo.name}' ready.`,
              name: newProjectInfo.name,
              port: newProjectInfo.port,
              pid: newProjectInfo.pid,
              cwd: newProjectInfo.cwd,
            },
            201
          );
      }
    })
    .delete("/projects/:name", async (c) => {
      const name = c.req.param("name");
      const projLog = logPrefix.project(name);
      console.log(`${projLog} API Request: DELETE /projects/${name}`);

      if (!activeProjectNames.has(name)) {
        console.warn(
          `${projLog} Delete request for non-active or unknown project '${name}'.`
        );
        const projectPath = path.join(PROJECTS_DIR, name);
        const accessRes = await safeAccess(projectPath);
        if (accessRes.kind === "ok") {
          console.warn(
            `${projLog} Found orphaned directory for non-active project. Removing ${projectPath}.`
          );
          await safeRm(projectPath, { recursive: true, force: true });
        }
        return c.json(
          { error: `Project '${name}' not found or not active.` },
          404
        );
      }

      const projectsResult = await getRunningProjects();

      const projectToKillResult = iife(() => {
        switch (projectsResult.kind) {
          case "error":
            return projectsResult;
          case "ok":
            const project = projectsResult.value.find((p) => p.name === name);
            if (!project) {
              return err(`Process not found for active project '${name}'.`);
            }
            return ok(project);
        }
      });

      let killAndDeleteResult: Result<void>;

      switch (projectToKillResult.kind) {
        case "error":
          console.warn(
            `${projLog} ${projectToKillResult.error} Removing from active list and attempting directory cleanup.`
          );
          activeProjectNames.delete(name);
          const projectPath = path.join(PROJECTS_DIR, name);
          await safeRm(projectPath, { recursive: true, force: true });
          await safeRm(projectPath, { recursive: true, force: true });
          setImmediate(ensureWarmInstance);
          return c.json(
            {
              message: `Project '${name}' process not found or error checking processes; removed from active list and attempted cleanup.`,
            },
            404
          );

        case "ok":
          const projectInfo = projectToKillResult.value;
          killAndDeleteResult = await killProjectProcess(
            projectInfo.pid,
            projectInfo.cwd,
            projectInfo.name
          );
          activeProjectNames.delete(name);
          setImmediate(ensureWarmInstance);

          switch (killAndDeleteResult.kind) {
            case "error":
              console.error(
                `${projLog} !!! Error deleting project '${name}': ${killAndDeleteResult.error}`
              );
              return c.json(
                {
                  error: `Failed to fully delete project '${name}'. Reason: ${killAndDeleteResult.error}`,
                },
                500
              );
            case "ok":
              console.log(`${projLog} ---> Project deleted successfully.`);
              return c.body(null, 204);
          }
      }
    });

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  const handleFatalError = async (origin: string, error: unknown) => {
    console.error(`\n${logPrefix.daemon} !!! ${origin} !!!\n`, error);
    if (!isShuttingDown) {
      console.log(
        `${logPrefix.daemon} Attempting graceful shutdown due to fatal error...`
      );
      try {
        isShuttingDown = true;
        await cleanupProcesses();
        console.log(`${logPrefix.daemon} Graceful shutdown attempt finished.`);
      } catch (shutdownErr) {
        console.error(
          `${logPrefix.daemon} Error during graceful shutdown attempt:`,
          shutdownErr
        );
      } finally {
        process.exit(1);
      }
    } else {
      console.log(`${logPrefix.daemon} Already shutting down, forcing exit.`);
      process.exit(1);
    }
  };

  process.on("uncaughtException", (err, origin) => {
    handleFatalError(`Unhandled Exception at: ${origin}`, err);
  });
  process.on("unhandledRejection", (reason, promise) => {
    handleFatalError("Unhandled Rejection at:", { promise, reason });
  });

  runInitializeAndServe(app);
  return route;
};

// export type DaemonAppType = Awaited<ReturnType<typeof createDaemon>>;
//  export type DaemonAppType = Awaited<ReturnType<typeof createDaemon>>;
//
