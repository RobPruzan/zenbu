import { injectWebSocket, sockets } from "./inject-websocket";
import { serve } from "@hono/node-server";

import { Hono } from "hono";
import { type Server as HttpServer } from "node:http";

import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

export const createServer = async () => {
  const app = new Hono();
  const route = app.use("*", cors()).post(
    "/ingest",

    async (opts) => {
      // const validatedData = opts.req.valid("json");

      const { name, data } = await opts.req.json();
      console.log("ingesting", name, data);

      sockets.forEach((socket) => {
        socket.emit("message", {
          name,
          data,
        });
      });

      return opts.json({ success: true });
    }
  );

  const port = 6001;
  const hostname = "localhost";
  const $server = serve(
    {
      fetch: app.fetch,
      port,
      hostname,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    }
  );

  const server = $server.listen(port, hostname);
  injectWebSocket(server as HttpServer);

  process.on("exit", () => {
    console.log("im done for");
  });

  return server;
};
