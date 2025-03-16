import { serve } from "@hono/node-server";
import { Hono } from "hono";

export const createServer = () => {
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

  return app;
};



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


