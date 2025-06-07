#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";

const args = process.argv.slice(2);
const markerIndex = args.indexOf("--marker");
let marker = "";
if (markerIndex !== -1 && args[markerIndex + 1]) {
  marker = args[markerIndex + 1];
  args.splice(markerIndex, 2);
}

if (marker) {
  process.title = marker;
}

const vitePath = path.join(process.cwd(), "node_modules", ".bin", "vite");

const viteProcess = spawn(vitePath, args, {
  stdio: "inherit",
  env: process.env,
});

viteProcess.on("error", (error) => {
  console.error("Failed to start vite:", error);
  process.exit(1);
});

viteProcess.on("exit", (code, signal) => {
  if (signal) {
    console.log(`Vite process killed with signal ${signal}`);
    process.exit(1);
  } else {
    process.exit(code || 0);
  }
});

["SIGTERM", "SIGINT", "SIGHUP"].forEach((signal) => {
  process.on(signal, () => {
    if (!viteProcess.killed) {
      // @ts-expect-error
      viteProcess.kill(signal);
    }
  });
});

new Promise(() => {});
