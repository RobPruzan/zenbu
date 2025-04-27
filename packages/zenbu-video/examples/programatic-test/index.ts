// console.log("Hello via Bun!");
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Effect } from "effect";
import { z } from "zod";

import { FileSystem } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { eventWithTime } from "@rrweb/types";

const eventsPath =
  "/Users/robby/zenbu/packages/zenbu-video/examples/replay-collection/public/events.json";

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

type Upload = z.infer<typeof uploadSchema>;

const program = Effect.gen(function* () {
  console.log("starting");

  const fs = yield* FileSystem.FileSystem;
  const eventsString = yield* fs.readFileString(eventsPath);
  const events = JSON.parse(eventsString) as Array<eventWithTime>;

  const upload: Upload = {
    fpsDiffs: [],
    startAt: events[0].timestamp,
    endAt: events.at(-1)!.timestamp, // we had this because the semantic
    // recording and the last mutation are different times, we may want this in
    // the    // future
    //
    events: events,
    interactions: [],
  };

  console.log("sending ", upload);

  const res = yield* Effect.tryPromise(() =>
    fetch(
      `http://localhost:7500/replay/upload/video?callback=${encodeURIComponent("http://localhost:8080/callback")}`,
      {
        body: JSON.stringify(upload),
        method: "POST",
      }
    )
  );
  console.log("uploaded");

  const json = yield* Effect.tryPromise(() => res.json()).pipe(
    Effect.mapError(() => null)
  );

  console.log("json", json);
});

export const createServer = () => {
  const app = new Hono().post("/callback", async (opts) => {
    const req = await opts.req.json();

    console.log(req);
  });

  const port = 8080;
  const host = "localhost";
  const _ = serve(
    {
      fetch: app.fetch,
      port,
      hostname: host,
    },
    (info) => {
      console.log(`Server is running on http://${host}:${info.port}`);
    }
  );
};

NodeRuntime.runMain(program.pipe(Effect.provide(NodeContext.layer)));
