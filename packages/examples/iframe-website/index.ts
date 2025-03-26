import { serve } from "bun";
const port = 4200;
serve({
  port: port,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Serve static files
    if (path !== "/" && path !== "/index.html") {
      try {
        const file = Bun.file(`${import.meta.dir}${path}`);
        if (await file.exists()) {
          // Set proper Content-Type for JavaScript modules
          const headers = new Headers();
          if (path.endsWith('.js')) {
            headers.set("Content-Type", "text/javascript");
          } else if (path.endsWith('.css')) {
            headers.set("Content-Type", "text/css");
          }
          return new Response(file, { headers });
        }
      } catch (e) {
        return new Response("Not Found", { status: 404 });
      }
    }

    // Serve index.html for root path
    const html = await Bun.file(`${import.meta.dir}/index.html`).text();
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});

console.log(`Server running at http://localhost:${port}`);
