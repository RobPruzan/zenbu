const fs = require("fs");
const path = require("path");

function fixViteOutput() {
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

  console.log("Post-build: Looking for HTML at:", htmlPath);

  if (fs.existsSync(htmlPath)) {
    console.log("Post-build: Found HTML file, processing...");

    // Read the HTML
    let html = fs.readFileSync(htmlPath, "utf-8");

    // Inject build timestamp
    html = html.replace(
      "</body>",
      `<script>window.__BUILD_TIMESTAMP__ = ${Date.now()};</script>\n</body>`
    );

    // Write to correct location
    fs.writeFileSync(targetPath, html);
    console.log("Post-build: Wrote HTML to:", targetPath);

    // Clean up
    if (fs.existsSync(webviewSrcPath)) {
      fs.rmSync(webviewSrcPath, { recursive: true });
      console.log("Post-build: Cleaned up webview-src directory");
    }

    console.log("✓ Fixed Vite output structure");
  } else {
    console.log("Post-build: HTML file not found at expected location");
  }
}

// Run the fix
fixViteOutput();
