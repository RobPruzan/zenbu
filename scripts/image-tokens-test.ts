import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const anthropic = new Anthropic();

const image_path = "/Users/robby/zenbu/screenshots/frame_1.png";
const image_media_type = "image/png";
const image_data = fs.readFileSync(image_path).toString("base64");

const response = await anthropic.messages.countTokens({
  model: "claude-3-7-sonnet-20250219",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: image_media_type,
            data: image_data,
          },
        },
      ],
    },
  ],
});
console.log(response);
