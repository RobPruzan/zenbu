import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { spawn } from "node-pty";

export const injectWebSocket = (server: HttpServer) => {
  const ioServer = new Server(server, {
    path: "/ws",
    serveClient: false,
    cors: {
      origin: "*", // narrow later
      methods: ["GET", "POST"],
    },

    transports: ["websocket"],
  });

  ioServer.use(async (socket, next) => {
    next();
  });

  ioServer.on("connection", async (socket) => {
    const shell = spawn("zsh", [], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: process.env.HOME,
      env: process.env,
    });

    shell.onData((data) => {
      socket.emit("output", data);
    });

    socket.on("input", (data) => {
      shell.write(data);
    });

    socket.on("resize", ({ cols, rows }) => {
      shell.resize(cols, rows);
    });

    socket.on("disconnect", () => {
      shell.kill();
    });
  });
};
