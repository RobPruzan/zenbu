import { Cluster } from "puppeteer-cluster";
import { Page } from "puppeteer";
import { cpus } from "os";
import { Upload } from ".";
import { EventType, eventWithTime } from "@rrweb/types";
import { spawn } from "child_process";
import type { RRwebPlayerOptions } from "rrweb-player";
import * as path from "path";
import * as fs from "fs";
import {
  getElementScreenshotHtml,
  ReactScanMetaPayload,
  ReactScanPayload,
} from "./get-screenshot";
import { mkdir } from "fs/promises";

console.log("Loading required files and paths...");

const rrwebScriptPath = path.resolve(
  require.resolve("rrweb-player"),
  "../../dist/index.js",
);
const rrwebStylePath = path.resolve(rrwebScriptPath, "../style.css");
console.log("Reading rrweb script from:", rrwebScriptPath);
const rrwebRaw = fs.readFileSync(rrwebScriptPath, "utf-8");
console.log("Reading rrweb styles from:", rrwebStylePath);
const rrwebStyle = fs.readFileSync(rrwebStylePath, "utf-8");
console.log("Reading react-scan script...");
const reactScanRaw = fs.readFileSync(
  "/Users/robby/dashboard-demo/packages/s3/node_modules/react-scan/dist/index.global.js",
  "utf-8",
);

const replayDir = path.join(__dirname, "../replays");
const videoDir = path.join(__dirname, "../videos");
const thumbnailDir = path.join(__dirname, "..", "thumbnails");
const elementScreenshotDir = path.join(__dirname, "../element-screenshots");
// todo: why are clips sometimes out of order, i lost the logs, but it looked something like
// timestamp: 2800
// timestamp: 1500
// when listening for the events being played in the player
// when this happened, the video recording was cut short, perhaps the end frame was hit too early

// todo, if the replayer does not play its last event for some timeout period, alert puppeteer and retry n times
export function getCompiledHtml(
  events: Array<eventWithTime>,
  config: Omit<RRwebPlayerOptions["props"], "events">,
  fps: number,
): string {
  console.log("Generating HTML template with", events.length, "events");
  const templatePath = path.resolve(__dirname, "template.html");
  let template = fs.readFileSync(templatePath, "utf-8");

  template = template.replace(/\$RRWEB_STYLE/g, rrwebStyle);
  template = template.replace(/\$REACT_SCAN_RAW/g, reactScanRaw);
  template = template.replace(/\$RRWEB_RAW/g, rrwebRaw);
  template = template.replace(
    /\$EVENTS/g,
    JSON.stringify(events).replace(/<\/script>/g, "<\\/script>"),
  );
  template = template.replace(
    /\$USER_CONFIG/g,
    config ? JSON.stringify(config) : "{}",
  );
  template = template.replace(/\$FPS/g, fps.toString());
  template = template.replace(
    /\$FIRST_EVENT_TIMESTAMP/g,
    events[0].timestamp.toString(),
  );

  return template;
}

export type InternalCluster = Cluster<any, any>;
export const getCluster = async () => {
  console.log("Getting or creating cluster...");
  // @ts-expect-error
  if (process.INTERNAL_CLUSTER) {
    console.log("Returning existing cluster");
    // @ts-expect-error
    return process.INTERNAL_CLUSTER as InternalCluster;
  }

  console.log("Creating new cluster with", cpus().length, "workers");
  const cluster: InternalCluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: cpus().length,
  });
  // @ts-expect-error
  process.INTERNAL_CLUSTER = cluster;

  return cluster;
};

const getViewport = (events: Array<eventWithTime>) => {
  console.log("Getting viewport dimensions from first event");
  const metaEvent = events[0];
  if (metaEvent.type !== 4) {
    throw new Error("Invariant: first event should be type 4");
  }

  const viewport = {
    width: metaEvent.data.width,
    height: metaEvent.data.height,
  };
  console.log("Viewport dimensions:", viewport);
  return viewport;
};
// rememberme: take a screenshot when browser alerts us, not determined by us
// ideame: we have the browser code implement a dynamic fps timer, it runs at target 15fps
// but adjusts based on true time

const makeCaptureProcess = ({
  fps,
  outputPath,
}: {
  fps: number;
  outputPath: string;
}) => {
  console.log("Creating FFmpeg capture process with", fps, "FPS");
  const captureProcess = spawn("ffmpeg", [
    "-framerate",
    fps.toString(),
    "-f",
    "image2pipe",
    "-i",
    "-",
    "-vf",
    "pad=ceil(iw/2)*2:ceil(ih/2)*2",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-y",
    outputPath,
  ]);
  captureProcess.stderr?.setEncoding("utf-8");
  let captureError = "";
  captureProcess.stderr?.on("data", (data) => {
    captureError += data;
    console.log("FFmpeg stderr:", data);
  });

  return captureProcess;
};

const getEventsTime = (events: Array<eventWithTime>) => {
  console.log("Calculating replay duration...");
  const replayStartTimeMs = events[0].timestamp;
  const replayEndTineMs = events[events.length - 1].timestamp;
  console.log("Replay duration:", replayEndTineMs - replayStartTimeMs, "ms");
  return { replayStartTimeMs, replayEndTineMs };
};

const padBuffer = ({
  totalFrames,
  captureProcess,
  config,
  frame,
}: {
  frame: Uint8Array;
  totalFrames: number;
  captureProcess: ReturnType<typeof makeCaptureProcess>;
  config: VideoGenerationConfig;
}) => {
  console.log("Padding video buffer...");
  // Array.from({ length: })

  const mp4Time = totalFrames * (1000 / config.fps);
  const inactivityAfterLastInteractionTime =
    config.targetVideoDuration - mp4Time;
  // trueEndAtDateTime - startTime - mp4Time;
  const duplicatesOfLastFrameNeeded = Math.ceil(
    inactivityAfterLastInteractionTime / (1000 / 15),
  );

  console.log("Adding", duplicatesOfLastFrameNeeded, "duplicate frames");
  Array.from({ length: duplicatesOfLastFrameNeeded }).forEach((_, i) => {
    console.log(
      "Writing duplicate frame",
      i + 1,
      "of",
      duplicatesOfLastFrameNeeded,
    );
    captureProcess.stdin.write(frame);
  });

  return duplicatesOfLastFrameNeeded;
};

type OnInteractionPayload =
  | {
      kind: "interaction-end";
      interactionUUID: string;
      dateNowTimestamp: number;
      memoryUsage: null | number;
    }
  | {
      kind: "interaction-start";
      interactionUUID: string;
      dateNowTimestamp: number;
    }
  | {
      kind: "fps-update";
      dateNowTimestamp: number;
      fps: number;
    };

type VideoGenerationConfig = {
  fps: number;
  targetVideoDuration: number;
  outputPath: string;
};

const iife = <T>(fn: () => T): T => fn();

const CAPTURE_TIMEOUT = 60_000;

const waitForVideoCapture = (
  captureProcess: ReturnType<typeof makeCaptureProcess>,
) => {
  console.log("Waiting for video capture to complete...");
  return new Promise<number>((resolve, reject) => {
    captureProcess.on("close", (code) => {
      console.log("Capture process closed with code:", code);
      resolve(code as number);
    });
    captureProcess.on("exit", (code) => {
      console.log("Capture process exited with code:", code);
      resolve(code as number);
    });

    // makes sure stderr is fully drained
    if (captureProcess.stderr) {
      captureProcess.stderr.resume();
    }

    const timeout = setTimeout(() => {
      console.error("FFmpeg capture process timed out");
      captureProcess.kill();
      reject(new Error("FFmpeg process timed out after 30 seconds"));
    }, CAPTURE_TIMEOUT);

    captureProcess.once("close", () => {
      console.log("Clearing capture timeout");
      clearTimeout(timeout);
    });
    captureProcess.once("exit", () => {
      console.log("Clearing capture timeout");
      clearTimeout(timeout);
    });
  });
};

type InteractionMetadata = {
  dateNowTimestamp: number;
  kind: "interaction-start" | "interaction-end";
  interactionUUID: string;
  occursAtInVideoMs: number;
  memoryUsage?: number | null;
  // occursAtInClipMs: number;
};

const generateFullVideoFromReplay = async ({
  // cluster,
  config,
  input,
  page,
}: {
  // cluster: InternalCluster;
  input: Upload;
  config: VideoGenerationConfig;
  page: Page;
}) => {
  console.log("Generating full video from replay...");
  // const { replayStartTimeMs, replayEndTineMs } = getEventsTime(input.events);
  const { height, width } = getViewport(input.events);

  console.log("Setting viewport:", { width, height });
  await page.setViewport({
    width,
    height,
  });

  console.log("Setting page content...");
  const html = getCompiledHtml(
    input.events,
    {
      width,
      height,
      speed: 1,
    },
    config.fps,
  );
  // console.log("compiled html", html);

  await page.setContent(html);

  console.log("Creating capture process...");
  const captureProcess = makeCaptureProcess({
    fps: config.fps,
    outputPath: config.outputPath,
  });

  let screenshotPromises: Array<Promise<any>> = [];

  let lastBufferedFrame: Uint8Array | null = null;
  let totalFrames = 0;
  const trackedInteractionMetadata: Array<InteractionMetadata> = [];
  const pendingInteractionsMetadata: Array<
    Omit<InteractionMetadata, "occursAtInVideoMs">
  > = [];

  const pendingFPSUpdates: Array<{
    kind: "fps-update";
    fps: number;
    dateNowTimestamp: number;
  }> = [];
  const trackedFPSUpdates: Array<{
    kind: "fps-update";
    dateNowTimestamp: number;
    occursAtInVideoMs: number;
    fps: number;
  }> = [];

  console.log("Setting up screenshot handler...");
  // ensures browser determines frame rate
  page.exposeFunction("onShouldScreenshot", async () => {
    const bufferPromise = page.screenshot({
      encoding: "binary",
      fullPage: false,
      optimizeForSpeed: true,
    });
    screenshotPromises.push(bufferPromise);
    const buffer = await bufferPromise;
    screenshotPromises = screenshotPromises.filter(
      (existing) => existing !== bufferPromise,
    );
    console.log("took screenshot for frame", totalFrames + 1);
    lastBufferedFrame = buffer;

    captureProcess.stdin.write(buffer);
    totalFrames++;
    const videoTimeMs = (totalFrames * 1000) / config.fps;

    if (pendingInteractionsMetadata.length > 0) {
      console.log("Processing pending interaction metadata...");
    }
    pendingInteractionsMetadata.forEach((pendingMeta) => {
      console.log(
        "Adding interaction metadata for UUID:",
        pendingMeta.interactionUUID,
      );
      trackedInteractionMetadata.push({
        interactionUUID: pendingMeta.interactionUUID,
        kind: pendingMeta.kind,
        occursAtInVideoMs: videoTimeMs,
        dateNowTimestamp: pendingMeta.dateNowTimestamp,
        memoryUsage: pendingMeta.memoryUsage,
      });
    });

    pendingInteractionsMetadata.length = 0;
    pendingFPSUpdates.forEach((pendingFPSUpdate) => {
      trackedFPSUpdates.push({
        occursAtInVideoMs: videoTimeMs,
        dateNowTimestamp: pendingFPSUpdate.dateNowTimestamp,
        kind: pendingFPSUpdate.kind,
        fps: pendingFPSUpdate.fps,
      });
    });

    pendingFPSUpdates.length = 0;
  });

  console.log("Setting up interaction metadata handler...");
  await page.exposeFunction(
    "onInteractionMetadata",
    (payload: OnInteractionPayload) => {
      if (payload.kind === "fps-update") {
        pendingFPSUpdates.push(payload);
        console.log("FPS update received:", payload.dateNowTimestamp);
        return;
      }
      console.log("Interaction metadata received:", payload);
      pendingInteractionsMetadata.push(payload);
    },
  );
  await new Promise(async (res, rej) => {
    await page.exposeFunction("onReplayFinish", async () => {
      console.log("Replay finished, waiting for video capture...");
      await Promise.all(screenshotPromises);
      if (lastBufferedFrame) {
        console.log("Padding video with last frame...");
        const addedFrames = padBuffer({
          captureProcess,
          config,
          frame: lastBufferedFrame,
          totalFrames: totalFrames,
        });
        // console.log('added frames to pad:',);

        totalFrames += addedFrames;
      }
      captureProcess.stdin.end();
      await waitForVideoCapture(captureProcess);

      const stats = await fs.promises.stat(config.outputPath);

      if (stats.size === 0) {
        console.error("Generated video file is empty");
        rej("Empty video file");
      }
      console.log("Video generation complete", config.outputPath);

      res(null);
    });
  });

  return {
    output: config.outputPath,
    metadata: trackedInteractionMetadata,
    fpsUpdates: trackedFPSUpdates,
    totalFrames,
  };
};

export const createReplayClips = ({
  cluster,
  input,
  config,
}: {
  cluster: InternalCluster;
  input: Upload;
  config: VideoGenerationConfig;
}) => {
  console.log("Creating replay clips...");
  return cluster.execute(null, async ({ page }) => {
    console.log("Executing cluster task...");
    const { output, metadata, totalFrames, fpsUpdates } =
      await generateFullVideoFromReplay({
        config,
        input,
        page,
      });

    console.log("Generating clips and thumbnails...", metadata, fpsUpdates);
    const [clips, thumbnails] = await Promise.all([
      generateClips({
        fullVideoPath: output,
        interactionsMetadata: metadata,
        videoTimeMs: (1000 / config.fps) * totalFrames,
        fpsUpdates,
      }),
      generateThumbnails({
        input,
        interactionsMetadata: metadata,
        mp4Path: output,
      }),
    ]);
    console.log("clips", clips);

    return {
      // fpsUpdates: fpsUpdates.map(fpsUpdate => ({
      //   ...fpsUpdate,
      //   occursAtInClipMs:
      // })),
      clips: clips.map((clip) => {
        // const meta = metadata.find(
        //   (m) =>
        //     m.interactionUUID === clip.metadata.interactionUUID &&
        //     m.kind !== clip.metadata.kind,
        // );
        // if (!otherMetadata) {
        //   throw new Error("Invariant, should always have a start and end");
        // }

        const start = clip.metadata.find(
          (meta) => meta.kind === "interaction-start",
        );
        const end = clip.metadata.find(
          (meta) => meta.kind === "interaction-end",
        );

        return {
          interactionStartMetadata: start,
          interactionEndMetadata: end,

          clipPath: clip.clipPath,
          fpsUpdates: clip.fpsUpdates,
        };
      }),
      thumbnails,
    };
  }) as Promise<{
    clips: Array<{
      interactionStartMetadata: InteractionMetadata;
      interactionEndMetadata: InteractionMetadata;
      // occursAtInClipMs: number;
      clipPath: string;
      fpsUpdates: Array<{
        occursAtInClipMs: number;
        kind: "fps-update";
        dateNowTimestamp: number;
        occursAtInVideoMs: number;
        value: number;
        fps: number;
      }>;
    }>;
    thumbnails: Awaited<ReturnType<typeof generateThumbnails>>;
  }>;
};

// we will dependency inject the cluster into our server

// const queueVideoGeneration = ({
//   cluster,
//   ...input
// }: {
//   cluster: InternalCluster;
// } & Upload) => {
//   return new Promise(async (res, rej) => {
//     const videoTask = await cluster.task(() => {});
//   });
// };

// export const createClusterTask = ()

// const makeServer = ()

export const processReplay = () => {};

export const generateClips = async ({
  fullVideoPath,
  interactionsMetadata,
  videoTimeMs,
  fpsUpdates,
}: {
  fullVideoPath: string;
  interactionsMetadata: Array<InteractionMetadata>;
  videoTimeMs: number;
  fpsUpdates: Array<{
    kind: "fps-update";
    dateNowTimestamp: number;
    occursAtInVideoMs: number;
    fps: number;
  }>;
}) => {
  console.log("Generating clips from full video...", fpsUpdates);
  const clips = await Promise.all(
    interactionsMetadata.map(async (metadata) => {
      if (metadata.kind !== "interaction-start") {
        return null;
      }

      const clipStartMs = Math.max(0, metadata.occursAtInVideoMs - 3000);

      const endMetadata = interactionsMetadata.find(
        (findMeta) =>
          findMeta.kind === "interaction-end" &&
          findMeta.interactionUUID === metadata.interactionUUID,
      );
      if (!endMetadata) {
        throw new Error("Invariant, must have matching end");
      }
      const clipEndMs = Math.min(
        videoTimeMs,
        endMetadata.occursAtInVideoMs + 3000,
      );
      console.log("clip bounds inputs", {
        metadata,
        endMetadata,
        clipEndMs,
        videoTimeMs,
        fullVideoPath,
      });

      console.log("Creating clip for interaction:", metadata.interactionUUID);
      const clipPath = path.join(replayDir, metadata.interactionUUID + ".mp4");
      await createClip({
        startTimeMs: clipStartMs,
        endTimeMs: clipEndMs,
        fullVideoPath,
        outputPath: clipPath,
      });

      return {
        fpsUpdates: fpsUpdates
          .filter(
            (update) =>
              update.occursAtInVideoMs >= clipStartMs &&
              update.occursAtInVideoMs <= clipEndMs,
          )
          .map((update) => ({
            ...update,
            occursAtInClipMs: update.occursAtInVideoMs - clipStartMs,
          })),
        clipPath,
        metadata: [
          {
            ...metadata,

            occursAtInClipMs: metadata.occursAtInVideoMs - clipStartMs,
          },
          {
            ...endMetadata,

            occursAtInClipMs: endMetadata.occursAtInVideoMs - clipStartMs,
          },
        ],
      };
    }),
  );

  console.log("filtered");

  return clips.filter((clip) => clip !== null) as Array<
    NonNullable<(typeof clips)[number]>
  >;
};

const msToSeconds = (ms: number) => ms / 1000;

const createClip = async ({
  fullVideoPath,
  outputPath,
  endTimeMs,
  startTimeMs,
}: {
  fullVideoPath: string;
  outputPath: string;
  startTimeMs: number;
  endTimeMs: number;
}) => {
  console.log("Creating clip...", {
    start: startTimeMs,
    end: endTimeMs,
    output: outputPath,
  });
  await new Promise<string>((resolveClip, rejectClip) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", // Input file path
      fullVideoPath,
      "-ss", // Seek to position (in seconds)
      msToSeconds(startTimeMs).toString(),
      "-t", // Duration to capture (in seconds)
      msToSeconds(endTimeMs - startTimeMs).toString(), // Duration is end - start
      "-vf", // Video filter
      "pad=ceil(iw/2)*2:ceil(ih/2)*2", // Pad dimensions to be even numbers for encoding
      "-vcodec", // Video codec to use
      "libx264", // H.264 codec
      "-pix_fmt", // Pixel format
      "yuv420p", // YUV420 planar pixel format - widely compatible
      "-preset", // Encoding speed preset
      "ultrafast", // Fastest encoding, larger file size
      "-y", // Overwrite output file without asking
      outputPath, // Output file path
    ]);

    ffmpeg.on("close", (code) => {
      console.log("FFmpeg clip creation finished with code:", code);
      if (code === 0) resolveClip(outputPath);
      else rejectClip(new Error(`FFmpeg exited with code ${code}`));
    });
  });
};

type NodeBounds = { x: number; y: number; width: number; height: number };

const generateThumbnails = async ({
  input,
  interactionsMetadata,
  mp4Path,
}: {
  input: Upload;
  interactionsMetadata: Array<InteractionMetadata>;
  mp4Path: string;
}) => {
  console.log("Generating thumbnails...");
  return await Promise.all(
    interactionsMetadata
      .map(async (metadata) => {
        if (metadata.kind === "interaction-end") {
          return;
        }
        console.log(
          "Generating thumbnail for interaction:",
          metadata.interactionUUID,
        );
        const thumbnailPath = path.join(
          thumbnailDir,
          `${metadata.interactionUUID}.png`,
        );

        await generateScreenshotFromMP4({
          mp4Path,
          outputPath: thumbnailPath,
          screenshotAtMs:
            metadata.occursAtInVideoMs +
            input.interactions.find(
              (intr) => intr.interactionUUID === metadata.interactionUUID,
            )?.msToRunJS!,
          // + metadata.blockingTime + 100 to get the scan overlays which occur <=100ms after commit
          // to be consistent maybe should fine the first render overlays after interaction
        });

        return {
          thumbnailPath,
          metadata,
        };
      })
      .filter((x) => x !== null),
  );
};

const getInteractionMetadata = ({
  interaction,
  input,
}: {
  input: Upload;
  interaction: Upload["interactions"][number];
}) => {
  console.log("Getting interaction metadata for:", interaction.interactionUUID);
  const filteredMeta = input.events
    .map((event) => {
      if (event.type !== 6 || event.data.plugin !== "react-scan-meta") {
        return null;
      }

      const payload = event.data.payload as ReactScanMetaPayload;
      if (payload.kind === "fps-update") {
        return;
      }
      if (payload.interactionUUID === interaction.interactionUUID) {
        return payload;
      }
    })
    .filter((meta) => !!meta);

  if (filteredMeta.length !== 2) {
    throw new Error(
      "Invariant, must have start and end only and at least: " +
        JSON.stringify(filteredMeta),
    );
  }

  // should always be in order
  const [startMetadata, endMetadata] = filteredMeta;

  return {
    startMetadata,
    endMetadata,
  };
};

const createScreenshotTaskFn = ({
  input,
  interaction,
}: {
  interaction: Upload["interactions"][number];
  input: Upload;
}) => {
  return async ({ page }: { page: Page }) => {
    console.group(
      `Creating screenshot for interaction: ${interaction.interactionUUID}`,
    );
    console.log("Input events length:", input.events.length);
    console.log("Interaction details:", {
      uuid: interaction.interactionUUID,
      domNodeToSnapshotId: interaction.domNodeToSnapshotId,
      msToRunJS: interaction.msToRunJS,
    });

    const { height, width } = getViewport(input.events);
    console.log("Viewport dimensions:", { height, width });

    console.log("Setting up page event listeners...");
    page.on("console", (msg) => console.log("[Browser Console]", msg.text()));
    page.on("error", (err) => console.error("[Browser Error]", err));
    page.on("pageerror", (err) => console.error("[Browser Page Error]", err));

    console.log("Setting viewport...");
    await page.setViewport({
      width,
      height,
    });

    console.log("Creating replay ready promise...");
    const replayReady = new Promise<void>((resolve) => {
      page.exposeFunction("onReplayReady", () => {
        console.log("Replay ready callback triggered");
        resolve();
      });
    });

    console.log("Creating DOM elements promise...");
    const nonVisibleDomElementsPromise = new Promise<{
      nonVisibleCount: number;
      totalCount: number;
    }>((resolve) => {
      page.exposeFunction(
        "onNonVisibleDomElements",
        (stats: { nonVisibleCount: number; totalCount: number }) => {
          console.log("DOM visibility stats:", stats);
          resolve(stats);
        },
      );
    });

    const offscreenRendersPromise = new Promise<
      Array<{
        offscreenRenders: number;
        totalRenders: number;
        name: string;
        selfTime: number;
      }>
    >((resolve) => {
      page.exposeFunction(
        "onOffscreenRendersStats",
        (
          stats: Array<{
            offscreenRenders: number;
            totalRenders: number;
            name: string;
            selfTime: number;
          }>,
        ) => {
          console.log("got render stats", stats);

          resolve(stats);
        },
      );
    });

    console.log("Navigating to blank page...");
    await page.goto("about:blank");

    console.log("Getting interaction metadata...");
    const { startMetadata, endMetadata } = getInteractionMetadata({
      interaction,
      input,
    });

    const startedAtFromReplayMs =
      startMetadata.dateNowTimestamp - input.events[0].timestamp;
    const endAtFromReplayMs =
      endMetadata.dateNowTimestamp - input.events[0].timestamp;
    console.log("Calculated replay start time:", startedAtFromReplayMs);

    console.log("Setting up clip rect promise...");
    const clipRectPromise = new Promise<NodeBounds>(async (res, rej) => {
      let timeout = setTimeout(() => {
        console.warn("Node bounds timeout hit after 15s");
        rej(new Error("Node bounds timeout hit"));
      }, 15_000);
      await page.exposeFunction("onBounds", (payload: NodeBounds) => {
        console.log("Received node bounds:", payload);
        clearTimeout(timeout);
        res(payload);
      });
    });

    console.log(
      "Setting page content for element screenshot...",
      input.events.filter((event) => {
        console.log(event.type, (event.data as any).plugin);

        if (event.type !== EventType.Plugin) {
          return;
        }

        if (event.data.plugin !== "react-scan-plugin") {
          return;
        }
        return true;
      }),
    );

    const lastEventTimestamp = input.events.at(-1)?.timestamp!;

    const getIndex = (kind: "interaction-start" | "interaction-end") =>
      input.events.findIndex((e) => {
        if (e.type !== 6) {
          return;
        }

        if (e.data.plugin !== "react-scan-meta") {
          return;
        }

        const payload = e.data.payload as ReactScanMetaPayload;

        if (payload.kind === "fps-update") {
          return;
        }

        if (payload.kind !== kind) {
          return;
        }

        return true;
      });
    const startIndex = getIndex("interaction-start");
    const endIndex = getIndex("interaction-end");
    const scanEventsNearInteraction = input.events
      .slice(startIndex, endIndex + 3) // the event will be one index after in the interaciton end in the general case
      .map((e) => {
        if (e.type !== 6) {
          return;
        }

        if (e.data.plugin !== "react-scan-plugin") {
          return;
        }

        const payload = e.data.payload as ReactScanPayload;

        return payload;
      })
      .filter((p) => typeof p !== "undefined");

    // console.log("our scans near the interaction", scanEventsNearInteraction);
    // const scanEventsNearInteraction = input.events
    //   .map((event) => {
    //     if (event.type !== EventType.Plugin) {
    //       return;
    //     }

    //     if (event.data.plugin !== "react-scan-plugin") {
    //       return;
    //     }

    //     const typed = event.data.payload as ReactScanPayload;

    //     const atInVideo = lastEventTimestamp - event.timestamp;

    //     console.log("this is at", atInVideo);

    //     console.log("its this far", Math.abs(endAtFromReplayMs - atInVideo));

    //     console.log("which i compared", endAtFromReplayMs, atInVideo);

    //     if (Math.abs(startedAtFromReplayMs - atInVideo) < 200) {
    //       return typed;
    //     }

    //     // if (typed.kind !== '')
    //   })

    // console.log("providing", scanEventsNearInteraction);

    await page.setContent(
      getElementScreenshotHtml(
        input.events,
        scanEventsNearInteraction,
        startedAtFromReplayMs,
        interaction.domNodeToSnapshotId,
      ),
    );

    console.log("Waiting for replay ready and DOM stats...");
    const [_, domStats, offscreenRenders] = await Promise.all([
      replayReady,
      nonVisibleDomElementsPromise,
      offscreenRendersPromise,
    ]);
    console.log("got offscreen render stats", {
      // offscreenRenders,
    });

    console.log("Promises resolved:", { domStats });

    console.log("Waiting for clip rect...");
    const clipRect = await clipRectPromise;
    console.log("Clip rect received:", clipRect);

    const outputPath = path.join(
      __dirname,
      "..",
      "element-screenshot",
      interaction.interactionUUID + ".png",
    );
    console.log("Screenshot output path:", outputPath);

    console.log("Creating screenshot directory...");
    await mkdir(path.dirname(outputPath), { recursive: true });

    console.log("Ensuring page is ready for screenshot...");

    console.log("Taking screenshot...", outputPath, clipRect);
    try {
      // if bug happens this race allows it to work
      // console.log("Checking page state before screenshot...");
      // const pageState = await page.evaluate(() => ({
      //   url: window.location.href,
      //   viewportSize: {
      //     width: window.innerWidth,
      //     height: window.innerHeight,
      //   },
      //   documentReady: document.readyState,
      //   replayerState: window.replayer
      //     ? {
      //         isPaused: window.replayer.service?.state?.matches("paused"),
      //         currentTime: window.replayer.getCurrentTime(),
      //       }
      //     : null,
      // }));
      // console.log("Page state:", pageState);

      const screenshotPromise = page.screenshot({
        path: outputPath,
        clip: clipRect || undefined,
        fullPage: !clipRect,
        encoding: "binary",
      });

      // Add timeout to screenshot operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Screenshot operation timed out after 5s"));
        }, 5000);
      });

      await Promise.race([screenshotPromise, timeoutPromise]);
      console.log("Screenshot taken successfully");
    } catch (error) {
      console.error("Error taking screenshot:", error);
      // Try one more time without the clip rect
      console.log("Retrying screenshot without clip rect...");
      await page.screenshot({
        path: outputPath,
        fullPage: true,
        encoding: "binary",
      });
      console.log("Fallback screenshot taken successfully");
    }

    console.log("Returning results");
    console.groupEnd();
    return { outputPath, domStats, interaction, offscreenRenders };
  };
};

export const collectElementScreenshotsAndStatistics = async ({
  input,
  cluster,
}: {
  input: Upload;
  cluster: InternalCluster;
}) => {
  console.log("Collecting element screenshots and statistics...");
  return await Promise.all(
    input.interactions.map((interaction) => {
      console.log("Processing interaction:", interaction.interactionUUID);
      const res = cluster.execute(
        null,
        createScreenshotTaskFn({
          input,
          interaction,
        }),
      ) as Promise<ReturnType<ReturnType<typeof createScreenshotTaskFn>>>;

      if (!res) {
        console.log("RES BUSTED FOR:", interaction);
      }
      return res;
    }),
  );
};

const generateScreenshotFromMP4 = ({
  mp4Path,
  outputPath,
  screenshotAtMs,
}: {
  screenshotAtMs: number;
  outputPath: string;
  mp4Path: string;
}) => {
  console.log("Generating screenshot from MP4...", {
    time: screenshotAtMs,
    output: outputPath,
  });
  return new Promise<string>((res, rej) => {
    const ffmpeg = spawn("ffmpeg", [
      "-ss", // Seek to position (in seconds)
      msToSeconds(screenshotAtMs).toString(),
      "-i", // Input file path
      mp4Path,
      "-vframes", // Number of frames to extract
      "1", // Extract a single frame
      "-vf", // Video filter
      "scale=iw:ih:force_original_aspect_ratio=decrease", // Scale while maintaining aspect ratio
      "-y", // Overwrite output without asking
      "-loglevel", // Set logging level
      "warning", // Only show warnings and errors
      outputPath, // Output file path
    ]);

    let ffmpegError = "";
    ffmpeg.stderr?.on("data", (data) => {
      ffmpegError += data.toString();
      console.log("FFmpeg screenshot stderr:", data.toString());
    });

    ffmpeg.on("close", (code) => {
      console.log("FFmpeg screenshot generation finished with code:", code);
      if (code === 0) {
        res(outputPath);
      } else {
        // Instead of rejecting, which would break the whole pipeline,
        // we'll resolve with null and handle missing thumbnails gracefully
        rej(new Error("Unable to generate thumbnail: " + String(ffmpegError)));
      }
    });
  });
  // })
};
