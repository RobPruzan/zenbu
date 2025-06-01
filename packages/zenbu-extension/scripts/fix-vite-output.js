const fs = require("fs");
const path = require("path");

const htmlPath = path.join(
  __dirname,
  "..",
  "out",
  "webview",
  "webview-src",
  "index.html"
);
const targetPath = path.join(__dirname, "..", "out", "webview", "index.html");
const webviewSrcPath = path.join(
  __dirname,
  "..",
  "out",
  "webview",
  "webview-src"
);

if (fs.existsSync(htmlPath)) {
  fs.renameSync(htmlPath, targetPath);
  if (fs.existsSync(webviewSrcPath)) {
    fs.rmSync(webviewSrcPath, { recursive: true });
  }
  console.log("✓ Fixed Vite output structure");
}
