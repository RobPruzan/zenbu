import { Effect } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";

/**
 * so have some distinct tasks we know we want now:
 *
 * - some crud operations over managing servers
 * - a nice server to see all the servers up and perform the crud actions on (debug site)
 * - do I want to always keep servers up/ re-up all servers? Or do it lazy so when you click it, it spins up again and cold starts?
 * - cause we can just really aggressively prefetch and it would be the same cost
 *  - so do you always dynamically request the URL from the daemon anytime you click it? That seems like high latency
 *  - hm maybe not you can just cache it I suppose
 * - we have some simple ops like unzipping safely, running the dev server, process stats stuff that I can reference from the dog shit implementation
 * - what's entrypoint? Well I suppose a server where you want to take an action, then recursively implement each sub functionality yippy skippy
 *
 * hono server time
 *
 * right so we don't actually need an entrypoint effect script, why was that for some reason hard before?
 *
 */

export const createServer = () => {
  const app = new Hono()
    .use("*", cors())
    .post("/create-project", async (opts) => {
      const idk = Effect.match(iNeedToGetGoodAtWritingEffectAgain, {
        onSuccess: () => {},
        onFailure: () => {},
      });
      const exit = await Effect.runPromiseExit(
        idk.pipe(Effect.provide(NodeFileSystem.layer))
      );

      exit;
    });
};

const iNeedToGetGoodAtWritingEffectAgain = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const entries = yield* fs.readDirectory("/idk");
  entries;
});
