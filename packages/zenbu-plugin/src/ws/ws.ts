import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
/**
 *
 *
 * plan, we are a websocket that people can connect to, and write to a database (batch and flush)
 *
 *
 * the client will connect to the websocket
 *
 * we will use react query initial data without refetching, then optimistic update the cache with the updates
 *
 *
 * we could model it as an event log? might make undo and debuggability nice?
 *
 *
 * yeah nice we can point the sqlite db either at remote or local that's nice
 *
 *
 */

export const injectWebSocket = (server: HttpServer) => {
  console.log("injecting");

  const ioServer = new Server(server, {
    path: "/ws",
    serveClient: false,
    cors: {
      origin: "*", // narrow later
      methods: ["GET", "POST"],
    },
    pingInterval: 2000,
    pingTimeout: 2000,
    transports: ["websocket"],
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  ioServer.use(async (socket, next) => {
    console.log("something something");
    next();
  });

  ioServer.on("connection", async (runtimeSocket) => {
    console.log("da connection");


    runtimeSocket.on('message', (e) => {
      console.log('hello', e);
      
    })
  });





};
