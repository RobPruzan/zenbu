import { defineConfig } from "tsup";
import { workerPlugin } from "./src/worker-plugin";

export default defineConfig({
  entry: ["src/devtools.ts"],
  format: ["iife"],
  clean: true,

  platform: 'browser',
  minify: true,
  esbuildPlugins: [workerPlugin],
  env: {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
   
  },
});
