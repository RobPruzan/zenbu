import { serve } from "@hono/node-server";

import { Hono, type MiddlewareHandler } from "hono";
import { type Server as HttpServer } from "node:http";

import { cors } from "hono/cors";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { nanoid } from "nanoid";
import { injectWebSocket } from "./v2/message-ws.js";

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
