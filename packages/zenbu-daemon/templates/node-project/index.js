const http = require("http");
const fs = require("fs");
const path = require("path");

let port = process.env.port || 3000;
const INDEX_HTML_PATH = path.join(__dirname, "index.html");

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    fs.readFile(INDEX_HTML_PATH, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": data.length,
        Connection: "close",
      });
      res.end(data);
    });
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
