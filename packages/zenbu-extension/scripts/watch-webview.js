const { spawn } = require("child_process");
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");

let isBuilding = false;
const buildStatusPath = path.join(__dirname, "..", "out", ".build-status");

function writeBuildStatus(status) {
  try {
    fs.mkdirSync(path.dirname(buildStatusPath), { recursive: true });
    fs.writeFileSync(
      buildStatusPath,
      JSON.stringify({ building: status, timestamp: Date.now() })
    );
  } catch (e) {
    // Ignore errors
  }
}

function runBuild() {
  if (isBuilding) return;

  isBuilding = true;
  console.log("🔨 Building webview...");
  writeBuildStatus(true);

  const buildProcess = spawn("npm", ["run", "build-webview"], {
    stdio: "inherit",
    shell: true,
  });

  buildProcess.on("close", (code) => {
    isBuilding = false;
    writeBuildStatus(false);
    if (code === 0) {
      console.log("✅ Build complete!");
    } else {
      console.error("❌ Build failed with code:", code);
    }
  });
}

// Initial build
runBuild();

// Watch for changes
const watcher = chokidar.watch(
  [
    path.join(__dirname, "..", "webview-src", "**/*.{ts,tsx,css,html}"),
    "!" + path.join(__dirname, "..", "webview-src", "**/*.d.ts"),
  ],
  {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  }
);

watcher
  .on("change", (path) => {
    console.log(`📝 File changed: ${path}`);
    runBuild();
  })
  .on("add", (path) => {
    console.log(`➕ File added: ${path}`);
    runBuild();
  })
  .on("unlink", (path) => {
    console.log(`➖ File removed: ${path}`);
    runBuild();
  });

console.log("👀 Watching for changes in webview-src...");

// Handle exit
process.on("SIGINT", () => {
  console.log("\n👋 Stopping watch...");
  watcher.close();
  process.exit(0);
});
