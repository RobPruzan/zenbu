import { serve } from "bun";
const port = 4200;
serve({
  port: port,
  async fetch(req) {
    const html = await Bun.file(
      "/Users/robby/zenbu/packages/examples/iframe-website/index.html"
    ).text();

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});

console.log(`Server running at http://localhost:${port}`);
