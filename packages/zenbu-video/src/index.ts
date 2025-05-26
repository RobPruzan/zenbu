import { Hono } from "hono";
import { FileSystem } from "@effect/platform";
import path from "path";
import { type eventWithTime } from "@rrweb/types";
import { Server, Socket, type DefaultEventsMap } from "socket.io";
import { type Server as HttpServer } from "node:http";
import { Context, Data, Effect, HashMap, Scope } from "effect";
import {
  NodeContext,
  NodeFileSystem,
  NodeRuntime,
} from "@effect/platform-node";
import type { Browser, Page } from "puppeteer";
import { serve } from "@hono/node-server";
import puppeteer from "puppeteer";
import os from "os";
import { spawn } from "node:child_process";
import { cors } from "hono/cors";

/**
 * used when executing inside page.evaluate, where the fn gets serialized and sent to the env where this type is valid
 */
declare global {
  interface Window {
    rrweb: any;
    replayer: any;
  }
}
const html = (strings: TemplateStringsArray, ...values: any[]) => {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || "");
  }, "");
};

const pageHtml = html`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Live Mirror</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: transparent;
        }
        .replayer-wrapper {
          background: transparent !important;
        }
        .message {
          font-size: 1.5em;
          color: #333;
        }
        #replay-container {
          width: 100vw;
          height: 100vh;
          background: white;
          border: 1px solid #ccc;
          box-sizing: border-box;
        }
      </style>
    </head>
    <body>
      <div class="message" style="display: none;">
        Waiting for rrweb events...
      </div>
      <div id="replay-container"></div>
    </body>
  </html>
`;

const framesToFolder = Effect.fn("framesToFolder")(function* () {
  const { socket } = yield* SocketContext;
  const frames = socket.data.frames;

  const fs = yield* FileSystem.FileSystem;
  const tempDir = yield* fs.makeTempDirectory({
    directory: os.tmpdir(),
    prefix: "screenshots",
  });

  console.log("we have", frames.length, "frames");

  const effects = frames.map((frame, index) =>
    Effect.gen(function* () {
      const fileName = `frame-${String(index).padStart(6, "0")}.png`;
      const filePath = path.join(tempDir, fileName);
      yield* fs.writeFile(filePath, frame.buffer);
    })
  );

  yield* Effect.all(effects);

  const fps =
    frames.length > 0
      ? Math.round(frames.length / ((Date.now() - frames[0].timestamp) / 1000))
      : 30;

  return {
    cleanup: fs.remove(tempDir, {
      recursive: true,
    }),
    fps,
    path: tempDir,
  };
});

const pngDirToVideo = ({ path, fps }: { path: string; fps: number }) =>
  Effect.fn("pngDirToVideo")(function* () {
    const fs = yield* FileSystem.FileSystem;

    const recordingsDir = yield* fs.makeDirectory("recordings", {
      recursive: true,
    });

    const timestamp = Date.now();
    const videoFilename = `recording-${timestamp}.mp4`;
    const outputPath = `recordings/${videoFilename}`;

    const ffmpeg = "ffmpeg";

    return yield* Effect.tryPromise(
      () =>
        new Promise<string>((resolve, reject) => {
          const proc = spawn(ffmpeg, [
            "-y",
            "-framerate",
            String(fps),
            "-i",
            `${path}/frame-%06d.png`,
            // "-vf",
            // "scale=max(iw\\,max_width):max(ih\\,max_height):force_original_aspect_ratio=decrease,pad=max_width:max_height:(ow-iw)/2:(oh-ih)/2:black",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            outputPath,
          ]);

          proc.on("error", (err) => {
            reject(`Failed to start ffmpeg: ${err}`);
          });

          proc.on("exit", (code) => {
            if (code === 0) {
              resolve(outputPath);
            } else {
              reject(`ffmpeg failed with exit code ${code}`);
            }
          });
        })
    );
  });

const mp4ToUrl = (path: string) =>
  Effect.fn("mp4ToUrl")(function* () {
    const filename = path.split("/").pop();
    if (!filename) {
      return yield* Effect.fail("Invalid path");
    }

    const baseUrl = `http://localhost:${port}`;
    const encodedFilename = encodeURIComponent(filename);
    const videoUrl = `${baseUrl}/recordings/${encodedFilename}`;

    return videoUrl;
  });

const BrowserContext = Context.GenericTag<{
  browser: Browser;
}>("BrowserContext");
declare global {
  namespace NodeJS {
    interface Process {
      existingBrowser?: Browser;
    }
  }
}

const stopCaptureAndGenerateVideo = Effect.fn("stopCaptureAndGenerateVideo")(
  function* () {
    const { socket } = yield* SocketContext;
    // accumulate a couple more frames
    yield* Effect.sleep("250 millis");
    clearTimeout(socket.data.recordingTimeout);
    const { cleanup, fps, path } = yield* framesToFolder();
    console.log("got frames", path);

    const videoPath = yield* pngDirToVideo({ fps, path })();
    console.log("video path", videoPath);

    yield* cleanup;
    const url = yield* mp4ToUrl(videoPath)();
    console.log("gotcha url");

    return url;
  }
);

const CAPTURE_DELAY = 33;

const startCapture = Effect.fn("startCapture")(function* () {
  const { socket } = yield* SocketContext;
  const capture = async () => {
    /**
     * should page.evaluate if the rrweb replayer is active, and if it's not and we don't want to record inactivity we omit screenshots
     */

    const buffer = await socket.data.page
      .screenshot({
        captureBeyondViewport: false,
      })
      .catch(() => null);

    //  const uh = socket.data.page.screencast();
    if (buffer) {
      socket.data.frames.push({ buffer, timestamp: Date.now() });
    }
    setTimeout(capture, CAPTURE_DELAY);
  };

  capture().catch(() => {
    /** */
  });
});
const port = 6969;
const createServer = Effect.fn("createServer")(function* () {
  const browser =
    process.existingBrowser ??
    (yield* Effect.tryPromise(() =>
      // oh maybe we don't need the context viewport ug
      puppeteer.launch({ headless: true, defaultViewport: null })
    ));

  process.existingBrowser = browser;

  console.log("browser yay", browser.connected);

  const app = new Hono()
    .use("*", cors())
    .get("/recordings/:videoPath", async (opts) => {
      const videoPath = decodeURIComponent(opts.req.param().videoPath);

      const filePath = path.join(process.cwd(), "recordings/" + videoPath);

      try {
        const fs = await import("fs/promises");
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
          return new Response("Not found", { status: 404 });
        }
        const fileBuffer = await fs.readFile(filePath);
        return new Response(fileBuffer, {
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": stat.size.toString(),
          },
        });
      } catch (err) {
        return new Response("Not found", { status: 404 });
      }
    });

  const hostname = "localhost";
  const $server = serve({
    fetch: app.fetch,
    port,
    hostname,
  });

  const server = $server.listen(port, hostname);
  yield* injectWebSocket(server as HttpServer)().pipe(
    Effect.provideService(BrowserContext, {
      browser,
    })
  ); // safe assert // safe assert https://github.com/orgs/honojs/discussions/1781#discussioncomment-7827318
});

type SocketMessage =
  | { kind: "event"; event: eventWithTime }
  | { kind: "create-recording" };
type SocketData = {
  page: Page;
  snapshotReceived: boolean;
  frames: Array<{ buffer: Uint8Array<ArrayBufferLike>; timestamp: number }>;
  recordingTimeout: number | undefined;
};

/**
 * it doesn't actually matter if we set it on the socket instance or distributed
 * through effect since we can just distribute the socket with the data and its
 * all the same, and this way I can block connection open for when the instance
 * is open, avoid having to await the page opening
 */

const injectWebSocket = (server: HttpServer) =>
  Effect.fn("injectWebSocket")(function* () {
    const ioServer = new Server<
      DefaultEventsMap,
      DefaultEventsMap,
      DefaultEventsMap,
      SocketData
    >(server, {
      path: "/ws",
      serveClient: false,
      cors: {
        origin: "*", // narrow later
        methods: ["GET", "POST"],
      },
      transports: ["websocket"],
    });

    const { browser } = yield* BrowserContext;
    console.log("hi?", browser.connected);

    ioServer.use(async (socket, next) => {
      console.log("connect attempt");

      const page = await browser.newPage();
      console.log("new page");

      await page.setContent(pageHtml);
      console.log("new content");

      const rrwebScriptPath = require.resolve("rrweb/dist/rrweb.min.js");
      const rrwebStylePath = require.resolve("rrweb/dist/rrweb.min.css");

      await page.addScriptTag({ path: rrwebScriptPath });
      await page.addStyleTag({ path: rrwebStylePath });
      console.log("scripts");

      await page.evaluate(() => {
        // @ts-ignore
        window.replayer = new rrweb.Replayer([], {
          root: document.getElementById("replay-container"),
          liveMode: true,
        });

        const BUFFER_MS = 500;
        window.replayer.startLive(Date.now() - BUFFER_MS);
        console.log("replayer initialized");
      });
      console.log("evaluated");
      socket.data = {
        page,
        snapshotReceived: false,
        frames: [],
        recordingTimeout: undefined,
      };
      next();
    });

    /**
     * i probably need a room, no?
     *
     * omg on open it sets it to the ws instance lol
     */
    ioServer.on("connection", async (socket) => {
      socket.on("message", async (message: SocketMessage) => {
        const exit = Effect.runPromiseExit(
          Effect.gen(function* () {
            switch (message.kind) {
              case "event": {
                const event = message.event;
                // console.log(
                //   "got event",
                //   event.type,
                //   "- type mapping: 0=DomContentLoaded, 1=Load, 2=Meta, 3=Custom, 4=Plugin"
                // );

                const vp = yield* extractViewport(event)();

                if (vp) {
                  console.log("updatinb viewport", vp);

                  yield* updateViewport(vp)().pipe(Effect.mapError(() => null));
                }

                yield* Effect.sleep("500 millis");

                yield* addEventToReplay(event)();
                if (!socket.data.snapshotReceived) {
                  /**
                   * if the first event through is not a dom snapshot event then
                   * we need to resync, it means the ws close but the tab wasn't
                   * actually closed
                   */

                  socket.data.snapshotReceived = true;
                  yield* startCapture();
                }
                return;
              }
              case "create-recording": {
                console.log("create reocridng case");

                // we actually we do want a case to delete the video, we don't
                // want to infinitely accumulate videos and eat disk
                const url = yield* stopCaptureAndGenerateVideo();
                socket.send({ action: "video", url });
                socket.data.frames = [];

                yield* startCapture();

                // Effect.gen(function* () {
                //   console.log("success yay");

                //   socket.send(JSON.stringify({ action: "video", url }));
                //   yield* startCapture();
                //   return;
                // }))
                //   .pipe(
                //   Effect.match({
                //     onSuccess: (url) =>

                //     onFailure: (shit) => {
                //       console.log(shit);
                //     },
                //   })
                // );
                return;
              }
            }
            message satisfies never;
          })
            .pipe(Effect.provide(NodeContext.layer))
            .pipe(
              Effect.provideService(SocketContext, {
                socket,
                // because we explicitly want to track if we have the rrweb viewport, otherwise puppeteer viewport may be not null, but not rrweb viewport
                viewport: { current: null },
              })
            )
        );

        // console.log(await exit);
      });

      socket.on("disconnect", async () => {
        // why is this closing browser??
        await socket.data.page.close();
      });
    });
  });

const SocketContext = Context.GenericTag<{
  socket: Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    SocketData
  >;
  viewport: {
    current: null | { width: number; height: number };
  };
}>("SocketContext");

const extractViewport = (event: eventWithTime & { data: any }) =>
  Effect.fn("extractViewport")(function* () {
    if (
      event &&
      event.type === 2 &&
      event.data &&
      typeof event.data.width === "number"
    ) {
      return {
        width: event.data.width as number,
        height: event.data.height as number,
      };
    }
    if (
      event &&
      event.type === 3 &&
      event.data &&
      event.data.source === 4 /* viewport-resize */
    ) {
      return {
        width: event.data.width as number,
        height: event.data.height as number,
      };
    }
    return null;
  });

const updateViewport = (newViewport: { width: number; height: number }) =>
  Effect.fn("updateViewport")(function* () {
    const { socket, viewport } = yield* SocketContext;
    if (
      !viewport.current ||
      viewport.current.width !== newViewport.width ||
      viewport.current.height !== newViewport.height
    ) {
      yield* Effect.tryPromise(() => socket.data.page.setViewport(newViewport));
      viewport.current = newViewport;
    }
  });

const addEventToReplay = (event: eventWithTime) =>
  Effect.fn("addEventToReplayer")(function* () {
    const { socket } = yield* SocketContext;

    yield* Effect.tryPromise(() =>
      socket.data.page.evaluate((event: eventWithTime) => {
        console.log("add event", event.type, window.replayer.addEvent);

        window.replayer.addEvent(event);
      }, event)
    );
  });

NodeRuntime.runMain(createServer());

process.on("beforeExit", async () => {
  await process.existingBrowser?.close();
});
