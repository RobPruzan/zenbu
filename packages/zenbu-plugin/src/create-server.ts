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
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { ChatMessage } from "./ws/utils.js";
import { exists } from "node:fs";
import { nanoid } from "nanoid";
import { injectWebSocket } from "./v2/message-ws.js";
import console from "node:console";

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

const VERSION = "0.0.0";

/**
 *
 * sqlite here, then connect via drizzle
 * or should the next server manage the drizzle instance? Would I ever want to access it in the
 * wait im so stupid
 *
 *
 * it definitely cannot be here since this is just a plugin that will be able to run via a public api
 *
 * it of course not couple the global app state
 *
 * so we either can setup the db next to the daemon or next to the actual application (next server with trpc)
 *
 * i vote that because that's what I want to query from anyways
 *
 * also makes it easier for me since it's already setup
 *
 * I don't think I'd ever even want to query the DB from the other locations? It should just push data to the client/manage servers
 *
 * er but this case is a little weird- spawn experiment:
 *  - frontend requests to a server that a process should be spawned
 *  - we need to tag it with metadata? So then we wait then request our backend
 *
 * okay im dumb you obviously just make an RPC that handles this whole process and communicating with the daemon
 *
 * okay this is a good programming model that I'm happy with
 *
 */
const createStore = async () => {
  // todo: check for version file too and if it matches
  const exists = await stat(".zenbu")
    .catch(() => null)
    .then((data) => !!data);
  if (exists) {
    return;
  }
  await mkdir(".zenbu");
  await mkdir(".zenbu/screenshots");
};

export const createServer = async () => {
  await createStore();
  const app = new Hono();
  app.use("*", cors());

  const route = app
    .post(
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
    )
    .get("/video/:path", async (opts) => {
      const path = opts.req.param("path");
      const bytes = await readFile(`.zenbu/video/${path}`);
      return new Response(bytes, {
        headers: {
          ["Content-type"]: "video/webm",
        },
      });
    })
    // waidaminute
    .post("/video/upload", async (opts) => {
      // uh is it any different from image upload? form data get the bytes write? I suppose..

      const formData = await opts.req.formData();

      const video = formData.get("video");

      if (!(video instanceof File)) {
        throw new Error("womp womp need a video in form data");
      }

      const videoBytes = await video.bytes();

      // again, should auto detect file extension
      const path = `vid-${Date.now()}-${nanoid()}.webm`;

      await writeFile(`.zenbu/video/${path}`, videoBytes);

      return opts.json({
        success: true,
        path,
      });
    })
    .get("/image/:path", async (opts) => {
      const leafPath = opts.req.param("path");

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "image/png");
      const path = `.zenbu/screenshots/${leafPath}`;

      const file = await readFile(path);

      const res = new Response(file, {
        headers: myHeaders,
      });

      return res;
    })
    .post("/uploads", async (opts) => {
      console.log("uploading");

      const formData = await opts.req.formData();

      const file = formData.get("file");
      if (!file) {
        throw new Error("validation error needs file in form data womp womp");
      }

      if (!(file instanceof File)) {
        throw new Error("validation error should be file womp womp");
      }

      const fileBytes = await file.bytes();

      const now = Date.now();
      const fileName = `file-${now}-${nanoid()}.${file.name.split(".").pop() || "bin"}`;
      const path = `.zenbu/uploads/${fileName}`;

      await writeFile(path, fileBytes);

      return opts.json({
        success: true,
        fileName,
      });
    })
    .get("/uploads/:path", async (opts) => {
      const leafPath = opts.req.param("path");
      const path = `.zenbu/uploads/${leafPath}`;

      const file = await readFile(path);

      return new Response(file);
    })
    .post("/upload", async (opts) => {
      // this may be fire hold up??
      // i guess we want form shit
      // yeah cause that chunks or whatever i should review the form data impl I had
      const formData = await opts.req.formData();

      const image = formData.get("image");
      if (!image) {
        throw new Error("validation error needs image in form data womp womp");
      }

      if (!(image instanceof File)) {
        throw new Error("validation error should be file womp womp");
      }

      /**oh i guess i can just write the bytes directly the dir?
       * should setup some auto creation on the dirs so i know they are there by the time the server starts and then just assert it
       *
       */
      const imageBytes = await image.bytes();

      const now = Date.now();

      const fileName = `ss-${now}-${nanoid()}.png`;
      // oops we need to upload this somewhere else or detect files correctly
      // oops this is writing to the wrong dir, needs to be to the actual project lol
      // wait does it?
      // no it doesn't :o
      // you can just scope to the plugin i suppose, and have a hidden dir with stuff? Is this preferred? Idk
      const path = `.zenbu/screenshots/${fileName}`;

      await writeFile(path, imageBytes);

      return opts.json({
        success: true,
        fileName,
      });
    });
  const port = 5001;
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

export type AppType = Awaited<ReturnType<typeof createServer>>;

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
