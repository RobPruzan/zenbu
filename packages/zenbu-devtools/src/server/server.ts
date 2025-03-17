import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";

serve({
  port: 42069,
  fetch() {
    const filePath = join(__dirname, "../../dist/devtools.global.js");
    const content = readFileSync(filePath, "utf-8");

    return new Response(content, {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  },
});
