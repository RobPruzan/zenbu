import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod";
import { type FocusedInfo } from "zenbu-devtools";
import type { InputToDataByTarget } from "hono/types";
import { shim } from "./validator-shim.js";
import { cors } from "hono/cors";
import { makeEdit } from "./ai.js";
import { readFile, writeFile } from "node:fs/promises";

const operateOnPath =
  "/Users/robby/zenbu/packages/examples/iframe-website/index.ts";

// const someSchema = type<FocusedInfo>({
//   domRect: {
//   bottom: 'Type definitions must be strings or objects (was number) '
// }

export type ChatMessage =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string;
    };
export const createServer = () => {
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

      // console.log("new file", newFile);

      await writeFile(operateOnPath, res.object.newFile);

      return opts.json({
        success: true,
        input,
        res,
      });
    }
  );
  serve(
    {
      fetch: app.fetch,
      port: 5001,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    }
  );

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
