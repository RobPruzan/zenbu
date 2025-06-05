import { injectWebSocket } from "./inject-websocket";
import { serve } from "@hono/node-server";

import { Hono } from "hono";
import { type Server as HttpServer } from "node:http";

import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { io } from "socket.io-client";


let teardownSocket: null | (() => void) = null


const createSocket = () => {
  /**
   *  wait surely there's a better way to do this right
   * what if i just globally access the socket 
   */

}

export const createServer = async () => {
  const socket = createSocket()
  const app = new Hono();
  const route = app.use("*", cors()).post(
    "/ingest",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        data: z.any(),
      })
    ),
    async (opts) => {
      const data = opts.req.valid("json");


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
  injectWebSocket(server as HttpServer); // safe assert // safe assert https://github.com/orgs/honojs/discussions/1781#discussioncomment-7827318

  process.on("exit", () => {
    console.log("im done for");
  });

  return route;
};
