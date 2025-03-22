import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import { config } from "dotenv";
import { ChatMessage } from "./ws/utils.js";
import { readFile } from "node:fs/promises";

config();

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required");
}

export const makeEdit = async ({
  file,
  messages,
}: {
  file: string;
  messages: Array<ChatMessage>;
}) => {
  const cleanedMessages = messages.map((m) => ({
    content: m.content,
    role: m.role,
  }));
  cleanedMessages.push({
    role: "assistant",
    content:
      "Here is the file I want you to edit on. Given what I selected (im giving you the outer HTML of the element I want you to edit, and some metadata about it) and the edit I requested in my message please return the entire file back with the change applied. Do not omit any code since I will be writing your output directly to the file" +
      "\n" +
      file,
  });

  return {
    res: await generateObject({
      messages: cleanedMessages,

      model: anthropic("claude-3-5-sonnet-latest"),
      schema: z.object({
        newFile: z.string(),
      }),
      // prompt: "How many people will live in the world in 2040?",
    }),

    input: cleanedMessages,
  };
};

export const getZenbuPrompt = async () => {
  // todo: don't hardcode path
  // todo: this needs to be a template
  const fileContent = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/system-prompt.md",
    "utf-8"
  );

  return fileContent;
};
