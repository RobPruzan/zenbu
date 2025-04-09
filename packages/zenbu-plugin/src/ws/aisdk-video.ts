import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import "dotenv/config";

async function main() {
  const fileManager = new GoogleAIFileManager(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY!
  );

  const filePath = "<your-video>";

  let geminiFile = await fileManager.uploadFile(filePath, {
    name: `ai-${Math.random().toString(36).substring(7)}`,
    mimeType: "video/webm",
  });

  console.log("Uploaded file", geminiFile);

  while (true) {
    if (geminiFile.file.state !== FileState.ACTIVE) {
      console.log("File state:", geminiFile.file.state);

      geminiFile = { file: await fileManager.getFile(geminiFile.file.name) };
      await new Promise((res) => {
        setTimeout(() => {
          res(null);
        }, 1000);
      });
      continue;
    }
    break;
  }

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What am I doing in the video?",
          },
          {
            type: "file",
            data: geminiFile.file.uri,
            mimeType: geminiFile.file.mimeType,
          },
        ],
      },
    ],
  });

  console.log(text);
}

main().catch(console.error);
