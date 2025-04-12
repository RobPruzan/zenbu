import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

/**
 *
 * lock in time
 *
 *
 * can unzip a project setup correct, run dev server, maybe save it with a cache?
 *
 * should it be an http server? Well of course
 *
 *
 * list all active projects (derived? may be tough)
 *
 * okay actually i can totally derive this with process titles
 *
 *
 * note, should serve favicons for their projects
 *
 *
 *
 * prewarm next server, maybe i should make work so it just works for prewarming n? That's obviously much harder though
 *
 *
 */
