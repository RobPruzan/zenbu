import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/devtools.ts"],
  format: ["iife"],
  clean: true,
});
