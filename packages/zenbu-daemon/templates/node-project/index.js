const http = require("http");
const fs = require("fs");
const path = require("path");

let port = process.env.PORT || 3000;
const INDEX_HTML_PATH = path.join(__dirname, "index.html");
const INDEX = fs.readFileSync(INDEX_HTML_PATH);

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Content-Length": INDEX.length,
      Connection: "close",
    });
    res.end(INDEX);
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${port} is already in use, trying port ${port + 1}...`);
    port++;
    setTimeout(() => {
      server.close();
      server.listen(port);
    }, 100);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});

server.on("listening", () => {
  const actualPort = server.address().port;
  console.log(`Listening: http://localhost:${actualPort}`);
  console.log(`Serving ${INDEX_HTML_PATH}`);
});

server.listen(port);
