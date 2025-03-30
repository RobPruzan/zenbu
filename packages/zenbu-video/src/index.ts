import { eventWithTime } from "@rrweb/types";
import * as path from "path";
import { Elysia, t } from "elysia";

import { join } from "node:path";
import { spawn } from "child_process";
import { unlink, mkdir } from "fs/promises";
import cors from "@elysiajs/cors";
import { z } from "zod";
import {
  collectElementScreenshotsAndStatistics as collectElementScreenshotsWithStatistics,
  createReplayClips,
  InternalCluster,
} from "./cluster";
import { Cluster } from "puppeteer-cluster";
import { cpus } from "os";

const replayDir = join(__dirname, "../replays");
const videoDir = join(__dirname, "../videos");
const thumbnailDir = join(__dirname, "../thumbnails");
const elementScreenshotDir = join(__dirname, "../element-screenshot");

await Promise.all([
  mkdir(replayDir, { recursive: true }),
  mkdir(videoDir, { recursive: true }),
  mkdir(thumbnailDir, { recursive: true }),
]);

const writeEventsToDisk = async (input: Upload) => {
  for (const interaction of input.interactions) {
    const replayPath = join(replayDir, `${interaction.interactionUUID}`);
    await Bun.write(
      replayPath,
      JSON.stringify({
        events: input.events,
        startAt: input.startAt,
        endAt: input.endAt,
        fpsDiffs: input.fpsDiffs,
      })
    );
  }
};

// const makeVideoPath = (interaction)

const uploadSchema = z.object({
  events: z.array(z.any()) as unknown as z.ZodType<Array<eventWithTime>>,
  interactions: z.array(
    z.object({
      interactionUUID: z.string(),
      interactionStartAt: z.number(),
      interactionEndAt: z.number(),
      domNodeToSnapshotId: z.number(),
      msToRunJS: z.number(),
    })
  ),
  startAt: z.number(),
  endAt: z.number(),
  fpsDiffs: z.array(z.tuple([z.number(), z.number()])),
});

export type Upload = z.infer<typeof uploadSchema>;
const port = 7500;

const startServer = (cluster: InternalCluster) => {
  console.log("Starting server...");
  const app = new Elysia()
    .get("/replay/video/:id", async ({ params: { id } }) => {
      console.log("GET /replay/video/:id", id);
      const videoPath = join(replayDir, `${id}.mp4`);
      // todo, adaptive bitrate streaming if we ever make clips longer than 6 seconds
      return new Response(Bun.file(videoPath), {
        headers: {
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=31536000",
          "Accept-Ranges": "bytes",
        },
      });
    })
    .get("/replay/thumbnail/:id", async ({ params: { id } }) => {
      console.log("GET /replay/thumbnail/:id", id);
      const thumbnailPath = join(thumbnailDir, `${id}.png`);
      return new Response(Bun.file(thumbnailPath), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    })
    .get("/replay/element-screenshot/:id", async ({ params: { id } }) => {
      console.log("GET /replay/element-screenshot/:id", id);
      const screenshotPath = join(elementScreenshotDir, `${id}.png`);
      console.log("da path", screenshotPath);

      return new Response(Bun.file(screenshotPath), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    })
    .get("/health", () => {
      console.log("GET /health");

      return {
        healthy: true,
      };
    })

    .post("/replay/upload/video", async ({ body, query, request }) => {
      console.log("POST /replay/upload/video", query);

      const callback = query["callback"];

      if (!callback) {
        throw new Error("Must provide a callback for result");
      }

      const input = uploadSchema.parse(JSON.parse(body as string));

      console.log("Parsed input with", input.events.length, "events");

      const task = async () => {
        console.log(
          "Starting task for",
          input.interactions.length,
          "interactions"
        );
        writeEventsToDisk(input);

        try {
          const [{ clips, thumbnails }, thumbnailsWithStats] =
            await Promise.all([
              createReplayClips({
                cluster,
                config: {
                  fps: 15,
                  outputPath: path.join(
                    __dirname,
                    "..",
                    "videos",
                    crypto.randomUUID() + ".mp4"
                  ),
                  targetVideoDuration: input.endAt - input.startAt,
                },
                input,
              }),

              collectElementScreenshotsWithStatistics({
                cluster,
                input,
              }),
            ]);
          console.log("gyat my rizzler", thumbnailsWithStats, clips);

          const processedClips = clips.map((clip) => {
            const thumbnailWithStatsItem = thumbnailsWithStats.find(
              (thumbnail) =>
                thumbnail.interaction.interactionUUID ===
                clip.interactionStartMetadata.interactionUUID
            );
            if (!thumbnailWithStatsItem) {
              console.log("returning NOPE");

              return null;
            }

            return {
              clipURL: `http://localhost:${port}/replay/video/${clip.interactionStartMetadata.interactionUUID}`,
              thumbnailURL: `http://localhost:${port}/replay/thumbnail/${clip.interactionStartMetadata.interactionUUID}`,
              elementScreenshotURL: `http://localhost:${port}/replay/element-screenshot/${clip.interactionStartMetadata.interactionUUID}`,
              interactionStartMetadata: clip.interactionStartMetadata,
              interactionEndMetadata: clip.interactionEndMetadata,
              stats: {
                dom: thumbnailWithStatsItem.domStats,
                offscreenRenders: thumbnailWithStatsItem.offscreenRenders,
              },
              fpsUpdates: clip.fpsUpdates,
            };
          });

          if (!processedClips.every((clip) => !!clip)) {
            console.log("no can do backaroo");

            return;
          }

          console.log("clips", processedClips);
          console.log("thumbnails", thumbnails);

          return processedClips;

          // return { clips: processedClips };
        } catch (e) {
          console.error("Failed at any point in the pipeline", e);
          return JSON.stringify({
            error: true,
          });
        }
      };

      task().then(async (clips) => {
        console.log("Task completed, sending callback to", callback);
        await fetch(callback, {
          method: "POST",
          body: JSON.stringify({ clips, interactions: input.interactions }),
        });
      });

      return {
        received: true,
      };
    })
    .use(cors({}))
    .listen({
      port: 7500,
      hostname: "localhost",
    });

  Bun.write(
    Bun.stdout,
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}\n`
  ).catch(console.error);

  return app;
};

(async () => {
  console.log("Initializing server...");

  // @ts-expect-error
  const cluster = process.CLUSTER
    ? // @ts-expect-error
      process.CLUSTER
    : await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 5,
        puppeteerOptions: {
          headless: true,
        },
        timeout: 60_000,
      });

  console.log("Cluster initialized");

  // @ts-expect-error
  process.CLUSTER = cluster;

  process.on("exit", async () => {
    console.log("Server shutting down...");
    await cluster.close();
  });

  // Add error handlers to catch and log unhandled errors
  process.on("uncaughtException", (err) => {
    Bun.write(Bun.stderr, `Uncaught Exception: ${err}\n`).catch(console.error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    Bun.write(
      Bun.stderr,
      `Unhandled Rejection at: ${promise} reason: ${reason}\n`
    ).catch(console.error);
    process.exit(1);
  });

  startServer(cluster);
})();

const normalizeTimestamp = (timestamp: number, clip: { startTime: number }) =>
  timestamp - clip.startTime;

/**
 * oops i want it on the clip level
 */

const mapDataToClip = <
  TClip extends { startTime: number; endTime: number; interactionUUID: string },
  TData extends { timestamp: number },
  TCombined extends TClip,
  // TCombine extends (clip: TClip, data: TData) => TCombined,
>(
  clips: Array<TClip>,
  items: Array<TData>,
  combineNewFn: (clip: TClip, data: TData, dataIndex: number) => TCombined,
  /* Should mutate the entry */
  combineExistingFn: (clip: TCombined, data: TData, dataIndex: number) => void,
  orElse: (clip: TClip) => NoInfer<TCombined>
) => {
  // const maps: Record<

  const interactionToClipWithFps = new Map<string, TCombined>();

  items.forEach((data, index) => {
    const associatedClips = clips.filter((clip) => {
      return clip.startTime <= data.timestamp && data.timestamp <= clip.endTime;
    });
    if (!associatedClips.length) {
      // invariant
      // log perchance
      return;
    }

    // const lastFPS = index === 0 ? null : (items.at(index - 1)?.timestamp ?? null);
    associatedClips.forEach((associatedClip) => {
      const existingClip = interactionToClipWithFps.get(
        associatedClip.interactionUUID
      );

      if (existingClip) {
        combineExistingFn(existingClip, data, index);
        // existingClip.fpsDiffs.push([fps, normalizeTimestamp(timestamp)]);
      } else {
        interactionToClipWithFps.set(
          associatedClip.interactionUUID,
          // invariant: non escaping function
          combineNewFn(associatedClip!, data, index)
          // {
          // ...associatedClip,
          // lastFPS,
          // fpsDiffs: [[fps, normalizeTimestamp(timestamp)]],
          // // wtf is this probably wrong and causing a bug look into it and don't be dumb
          // startAt: associatedClip.startTime,
          // }
        );
      }
    });
  });
  const withDataClips = Array.from(interactionToClipWithFps.values());

  return withDataClips.concat(
    clips
      .filter(
        (x) =>
          !withDataClips.some(
            (wData) => wData.interactionUUID === x.interactionUUID
          )
      )
      .map(orElse)
  );
};
type Meta = Array<
  | {
      kind: "interaction-end";
      dateNowTimestamp: number;
      interactionUUID: string;
      atInOriginalVideo: number;
      memoryUsage: null | number;
    }
  | {
      kind: "interaction-start";
      dateNowTimestamp: number;
      interactionUUID: string;
      atInOriginalVideo: number;
    }
  | {
      kind: "fps-update";
      dateNowTimestamp: number;
      atInOriginalVideo: number;
      fps: number;
    }
>;

const mapMetaToClips = (
  meta: Meta,
  clips: ReturnType<typeof mapFPSDiffsToClips>

  // clipStartTimeInSeconds: number
) => {
  const metaFormatted = meta.map((i) => ({
    ...i,
    timestamp: i.dateNowTimestamp,
  }));

  return mapDataToClip(
    clips,
    metaFormatted,
    (clip, data) => {
      return {
        ...clip,
        metadata: [
          {
            ...data,
            /* if the interaction occurred at 10s in the origin video,
             * and the clip started at 7s, then the video would occur
             * at 3s in the clip (10- 7), so then
             */
            relativeTimeToVideoStartMs:
              data.atInOriginalVideo - clip.clipStartOffsetFromOriginalInMs,
            // -
            // clip.startAt,
          },
        ],
      };
    },
    (clip, data) => {
      clip.metadata.push({
        ...data,
        relativeTimeToVideoStartMs:
          data.atInOriginalVideo - clip.clipStartOffsetFromOriginalInMs,
        // -
        // clip.startAt,
      });
    },
    (clip) => ({
      ...clip,
      metadata: [],
      lastFPS: null,
      fpsDiffs: [],
      startAt: clip.startTime,
    })
  );
};

export const mapFPSDiffsToClips = (
  fpsDiffs: Array<[fps: number, timestamp: number]>,
  clips: Array<{
    interactionUUID: string;
    videoUrl: string;
    // fpsDiffs: any;
    startTime: number;
    endTime: number;
    clipStartOffsetFromOriginalInMs: number;
    metadata: Awaited<ReturnType<any>>["metadata"]; // todo redo this with new data
    stats: {
      dom: {
        nonVisibleCount: number;
        totalCount: number;
      } | null;
    };
  }> // clips are disjoint
) => {
  const diffsFormatted = fpsDiffs.map(([fps, timestamp]) => ({
    timestamp,
    fps,
  }));

  return mapDataToClip(
    clips,
    diffsFormatted,
    (clip, data, dataIndex) => {
      const lastFPS =
        dataIndex === 0
          ? null
          : (diffsFormatted.at(dataIndex - 1)?.timestamp ?? null);
      const fpsDiffs: Array<[number, number]> = [];
      return {
        ...clip,
        lastFPS,
        fpsDiffs,
        // wtf is this probably wrong and causing a bug look into it and don't be dumb
        startAt: clip.startTime,
      };
    },
    (clip, data) => {
      clip.fpsDiffs.push([data.fps, normalizeTimestamp(data.timestamp, clip)]);
    },
    (clip) => ({
      ...clip,
      lastFPS: null,
      fpsDiffs: [],
      startAt: clip.startTime,
    })
  );
};

/**
 * todos here:
 *
 * - intake a list of interaction uuids, and the start/end of clip
 * - convert events to video
 * - once we have the video, make n cuts of the video, where each cut is start - 3 seconds, end + 3 seconds
 * - discard the full video
 * - return the list of uuid:video url mappings
 * - expose the video via endpoint
 */

/**
 * to collect fps diffs for each video:
 *
 *
 * get the timestamp range of each video
 *
 * collect the timestamps of each fps that belongs to the clip
 * include an initial fps value which is either null or the previous fps diff value
 * then we offset the timestamp by the clip timestamp start time to get the time the switch happens
 */

/**
 * fix the mapping
 *
 *
 * we need to map data to n overlapping clips if the clip is inside that range
 */
