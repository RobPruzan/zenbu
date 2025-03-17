// @ts-nocheck
import chokidar from "chokidar";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const DEVTOOLS_PATH =
  "/Users/robby/zenbu/packages/zenbu-devtools/dist/devtools.global.js";
const HOT_RELOAD_FILE =
  "/Users/robby/zenbu/packages/zenbu-app-v0/app/hot-reload.ts";

chokidar.watch(DEVTOOLS_PATH).on("change", async () => {
  await writeFile(
    HOT_RELOAD_FILE,
    `export default ${((Date.now() - 1741922242991) / 1000).toFixed(0)};`
  );
  console.log("Devtools changed - triggering hot reload");
});

console.log(`Watching ${DEVTOOLS_PATH} for changes...`);
