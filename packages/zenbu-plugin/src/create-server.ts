import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod";
import { type Server as HttpServer, type Server } from "node:http";

import { type FocusedInfo } from "zenbu-devtools";
import type { InputToDataByTarget } from "hono/types";
import { shim } from "./validator-shim.js";
import { cors } from "hono/cors";
import { getZenbuPrompt, makeEdit } from "./ai.js";
import { readFile, writeFile } from "node:fs/promises";
import { injectWebSocket } from "./ws/ws.js";
import { ChatMessage } from "./ws/utils.js";

const operateOnPath =
  "/Users/robby/zenbu/packages/examples/iframe-website/index.ts";

// const someSchema = type<FocusedInfo>({
//   domRect: {
//   bottom: 'Type definitions must be strings or objects (was number) '
// }

export const getTemplatedZenbuPrompt = async () => {
  const prompt = await getZenbuPrompt();

  return removeComments(prompt);
};

export const removeComments = (text: string): string => {
  return text.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
};
export const createServer = async () => {
  const app = new Hono();
  app.use("*", cors());

  const route = app.post(
    "/edit",
    shim<{
      messages: Array<ChatMessage>;
      focusedInfo: FocusedInfo;
    }>(),
    async (opts) => {
      const body = await opts.req.valid("json");

      const { res, input } = await makeEdit({
        file: await readFile(operateOnPath, "utf-8"),
        messages: body.messages,
      });

      await writeFile(operateOnPath, res.object.newFile);

      return opts.json({
        success: true,
        input,
        res,
      });
    }
  );
  const port = 5001;
  const host = "localhost";
  const $server = serve(
    {
      fetch: app.fetch,
      port: 5001,
      hostname: "localhost",
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    }
  );

  const server = $server.listen(port, host);
  injectWebSocket(server as HttpServer); // safe assert // safe assert https://github.com/orgs/honojs/discussions/1781#discussioncomment-7827318

  process.on("exit", () => {
    console.log("im done for");
  });

  return route;
};

export type AppType = ReturnType<typeof createServer>;

/**
 *
 *
 * what would allow the fasted feedback loop of editing the file and confirming?
 *
 *
 * well i'd like to see the file edited correctly
 *
 * i'd like to see the new result
 *
 *
 * okay then i just want this inside v0, and i can click buttons and request hard coded things can be changed
 *
 * then i want to see it live update in the preview
 */
