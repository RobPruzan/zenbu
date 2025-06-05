import type { Server as HttpServer } from "node:http";
import { DefaultEventsMap, Server, Socket } from "socket.io";
// import { Socket } from "socket.io-client";

// map so we can globally access the sockets
export const sockets: Array<Socket> = [];

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

  ioServer.on("connection", async (socket) => {
    sockets.push(socket);
    ioServer.on("message", () => {});
  });
};
