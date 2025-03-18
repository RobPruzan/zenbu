import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod";
import { type FocusedInfo } from "zenbu-devtools";
import type { InputToDataByTarget } from "hono/types";
import { shim } from "./validator-shim.js";

const operateOnPath =
  "/Users/robby/zenbu/packages/examples/iframe-website/index.ts";

// const someSchema = type<FocusedInfo>({
//   domRect: {
//   bottom: 'Type definitions must be strings or objects (was number) '
// }

export const createServer = () => {
  const app = new Hono<
    {},
    {
      "/edit": {
        post: {
          req: { name: string; age: number };
          res: { message: string };
        };
      };
    }
  >();

  const route = app.post("/edit", shim<FocusedInfo>(), async (opts) => {
    const focusedInfo = await opts.req.valid("json");

    return opts.json({
      success: true,
    });
  });
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
    console.log("im done for lol");
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
