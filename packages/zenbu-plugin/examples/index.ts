import { serve } from "@hono/node-server";
import { Hono } from "hono";
import fs from "fs";

const app = new Hono();

app.get("/", async (c) => {
  const html = await fs.promises.readFile("/Users/robby/zenbu/packages/zenbu-plugin/examples/index.html", "utf-8");
  return c.html(html);
});


serve(
  {
    fetch: app.fetch,
    port: 4200,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
