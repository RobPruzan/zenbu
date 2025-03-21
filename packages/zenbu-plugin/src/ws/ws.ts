import { anthropic } from "@ai-sdk/anthropic";
import { streamObject, streamText } from "ai";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import { z } from "zod";
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
export type EventLogEvent = ClientEvent | PluginServerEvent;

export type ClientEvent = {
  id: string
  kind: "user-message";
  context: any;
  text: string;
  requestId: string;
  timestamp: number;
};

export type PluginServerEvent = {
  id: string
  // hm if we want to progressively stream this and correctly render this we need ordering from the timestamp
  // and then we need to correctly render based on that order (for things like when we enter the next visual state)
  // has to be flat, not json structure
  kind: "assistant-simple-message";
  text: string;
  associatedRequestId: string;
  timestamp: number;
};

// i probably shouldn't couple events gr

// i will need to couple in event log, but i shouldn't couple the types themselves
export const injectWebSocket = (server: HttpServer) => {
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

  ioServer.use(async (socket, next) => {
    next();
  });

  ioServer.on("connection", async (socket) => {
    const roomId = socket.handshake.query.roomId as string;
    console.log("did we get a room id?", roomId);

    if (!roomId) {
      throw new Error("Invariant: roomId is required for socket connection");
    }

    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    socket.on("message", async (event: ClientEvent) => {
      console.log("got text", event.text);

      const { textStream } = streamText({
        model: anthropic("claude-3-5-sonnet-latest"),
        prompt: event.text,
      });
      console.log("awaiting stream");

      for await (const textPart of textStream) {
        ioServer.to(roomId).emit("message", {
          kind: "assistant-simple-message",
          associatedRequestId: event.requestId,
          text: textPart,
          timestamp: Date.now(),
          id: crypto.randomUUID()
        } satisfies PluginServerEvent);
        console.log(textPart);
      }
    });
  });
};
