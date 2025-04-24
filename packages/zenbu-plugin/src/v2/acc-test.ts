#!/usr/bin/env bun
/**
 * stream-demo.ts – quick sanity-check that our chunks-to-text helper
 * produces a non-duplicated transcript when talking to `o3-mini`.
 *
 *   $ bun add openai            # once
 *   $ OPENAI_API_KEY=sk-... bun stream-demo.ts
 */

/* ----------------------------- helper ------------------------------ */

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { streamObject, streamText, TextStreamPart, tool } from "ai";
import { config } from "dotenv";
import { chunk } from "effect/Config";
import { z } from "zod";
config();

process.env.OPEN_API_KEY =
  "OPENAI_API_KEY=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";

/** Rough superset of all current chunk shapes. */
type Part = { type: string; [key: string]: any };

/** Turn one stream part into a printable string (or skip it). */
const stringifyChunk = (
  part: TextStreamPart<{ stupid: any }>
): string | undefined => {
  switch (part.type) {
    case "text-delta":
      return part.textDelta;
    // case 'step-start': {
    //   return `${part.}`
    // }
    // case "step-finish": {
    //   return `Step Finish:${part.finishReason}`;
    // }
    case "reasoning":
      return `${part.textDelta}`;
    case "redacted-reasoning":
      return `${part.type}] ${part.data}`;
    case "tool-call":
      return `${JSON.stringify(part, null, 2)}`;
    case "tool-result":
      return `${JSON.stringify(part, null, 2)}`;
    case "source":
      return `${part.source?.title || "Unknown source"} ${part.source?.url ? `(${part.source.url})` : ""}`;
    case "error":
      return `${JSON.stringify(part.error)}`;
    case "finish":
    default:
      return;
  }
};

/** Reduce an array of parts to one de-duplicated transcript. */
const chunksToTranscript = (
  chunks: Array<TextStreamPart<{ stupid: any }>>
): string =>
  chunks
    .map(stringifyChunk)
    .join("");

/* ---------------------------- test run ----------------------------- */

// const openai = new OpenAI(); // uses OPENAI_API_KEY from env

// const tools = [
//   {
//     type: "function",
//     function: {
//       name: "add_numbers",
//       description: "Add two numbers",
//       parameters: {
//         type: "object",
//         properties: {
//           a: { type: "number" },
//           b: { type: "number" },
//         },
//         required: ["a", "b"],
//       },
//     },
//   },
//   {
//     type: "function",
//     function: {
//       name: "get_current_time",
//       description: "Return the current ISO timestamp",
//       parameters: { type: "object", properties: {}, required: [] },
//     },
//   },
// ] as const;

async function main() {
  // const stream = await openai.chat.completions.create({
  //   model: "o3-mini",
  //   stream: true,
  //   // tools:,
  //   messages: [
  //     {
  //       role: "system",
  //       content:
  //         "You are a helpful assistant. Call the tools when the user asks for arithmetic or the current time.",
  //     },
  //     {
  //       role: "user",
  //       content:
  //         "Hi! What is 2 + 3 using the add_numbers tool, and also what's the current time?",
  //     },
  //   ],
  // });
  const stream = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    // model: openai("o3-mini"),
    onChunk: (chunk) => {
      console.log("chunko", chunk);
    },
    providerOptions: {
      anthropic: {
        thinking: {
          type: "enabled",
          budgetTokens: 12000,
        },
      },

      // openai: {
      //   reasoningEffort: "low",
      // },
    },
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Call the tools when the user asks for arithmetic",
      },
      {
        role: "user",
        content:
          "Hi! What is 2 + 3 using the add_numbers tool. Always overthink!",
      },
    ],
    toolCallStreaming: true,
    tools: {
      add: tool({
        parameters: z.object({ a: z.number(), b: z.number() }),
        description: "Add a and b together",
        execute: async ({ a, b }) => (a + b).toString(),
      }),
    },
  });

  const parts: TextStreamPart<{ stupid: any }>[] = [];

  for await (const chunk of stream.fullStream) {
    // console.log("chunk", chunk);

    parts.push(chunk); // `as any` keeps the demo terse
  }

  console.log("\n===== TRANSCRIPT START =====\n");
  console.log(chunksToTranscript(parts));
  console.log("\n=====  TRANSCRIPT END  =====\n");
  console.log("the reasoning", await stream.reasoningDetails);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
