import { Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { getGeminiVideoURL } from "./message-ws";
import { accumulateEvents } from "./shared-utils";
// fix later
import { ClientEvent, ModelEvent } from "../../../zenbu-redis/src/redis";
import { CoreMessage, TextStreamPart } from "ai";

/**
 *  alright now we have it on the server, we just need it on the client which
 *  is as simple as mapping it to a url
 */
export const server_eventsToMessage = (
  events: Array<ClientEvent | ModelEvent>
) => {
  return Effect.gen(function* () {
    const accumulated = yield* accumulateEvents(events);

    const effects = accumulated.map((event) =>
      // todo: how do i do this not dog shit
      Effect.gen(function* () {
        {
          switch (event.kind) {
            case "user-message": {
              const effects = event.context.map((item) =>
                Effect.gen(function* () {
                  {
                    switch (item.kind) {
                      case "image": {
                        const fs = yield* FileSystem.FileSystem;

                        // TODO: change base when we have the central store that can be referenced everywhere
                        const fullPath = `/Users/robby/zenbu/packages/zenbu-plugin/.zenbu/screenshots/${item.filePath}`;
                        const bytes = yield* fs.readFile(fullPath);
                        return {
                          kind: "image" as const,
                          bytes,
                        };
                      }
                      case "video": {
                        const fullPath = `/Users/robby/zenbu/packages/zenbu-plugin/.zenbu/video/${item.filePath}`;
                        const upload = yield* getGeminiVideoURL(fullPath);
                        return {
                          kind: "video" as const,
                          data: upload.data,
                          mimeType: upload.mimeType,
                        };
                      }
                    }
                  }
                })
              );

              const context = yield* Effect.all(effects);

              return {
                ...event,
                context,
              };
            }
            case "model-message": {
              return event;
            }
          }
        }
      })
    );

    const coreMessages: Array<CoreMessage> = yield* Effect.all(effects).pipe(
      Effect.map((results) =>
        results.map((event) => {
          if (event.kind === "user-message") {
            return {
              role: "user" as const,
              content: [
                ...event.context.map((item) => {
                  switch (item.kind) {
                    case "image": {
                      return { type: "image" as const, image: item.bytes };
                    }
                    case "video": {
                      return {
                        type: "file" as const,
                        data: item.data,
                        mimeType: item.mimeType,
                      };
                    }
                  }
                }),
                { type: "text" as const, text: event.text },
              ],
            };
          } else {
            return {
              role: "assistant" as const,
              content: [
                { type: "text" as const, text: stringifyChunks(event.chunks) },
              ],
            };
          }
        })
      )
    );

    return coreMessages;
  });
};

const stringifyChunks = (chunks: Array<TextStreamPart<{ stupid: any }>>) => {
  const textChunks = transformToolCallDeltas(chunks).map((chunk) => {
    switch (chunk.type) {
      case "text-delta": {
        return chunk.textDelta;
      }
      case "reasoning": {
        return `${chunk.textDelta}`;
      }
      case "redacted-reasoning": {
        return `${chunk.data}`;
      }
      case "tool-call": {
        return `${JSON.stringify(chunk, null, 2)}`;
      }
      case "tool-call-delta": {
        console.log(chunk);

        return "";
        // return `${chunk.argsTextDelta}`
      }
      case "tool-result": {
        return `${JSON.stringify(chunk, null, 2)}`;
      }
      case "source": {
        return `${chunk.source?.title || "Unknown source"} ${chunk.source?.url ? `(${chunk.source.url})` : ""}`;
      }
      case "error": {
        return `${JSON.stringify(chunk.error)}`;
      }
      case "finish":
      default: {
        return "";
      }
    }
  });

  let acc = "";
  textChunks.forEach((chunk) => (acc += chunk));
  return acc;
};

const transformToolCallDeltas = (
  chunks: Array<TextStreamPart<Record<string, any>>>
) => {
  // let accumulatedArgDeltas = "";
  let currentTool: { toolCallId: string; toolName: string } | null = null;

  return chunks.reduce(
    (prev, curr) => {
      if (curr.type === "tool-call-streaming-start") {
        currentTool = {
          toolCallId: curr.toolCallId,
          toolName: curr.toolName,
        };

        return [
          ...prev,
          {
            type: "tool-call" as const,
            args: "", // pls
            toolCallId: curr.toolCallId,
            toolName: curr.toolName,
          },
        ];
      }
      if (curr.type === "tool-call-delta") {
        const lastEvent = prev.at(-1);
        if (lastEvent?.type !== "tool-call") {
          throw new Error(JSON.stringify({
            reason: "invariant",
            lastEvent,
            expected: 'tool-call'
          }));
        }
        lastEvent.args += curr.argsTextDelta;
        return prev
      }
      if (curr.type === "tool-call") {
        const lastEvent = prev.at(-1);
        if (lastEvent?.type !== "tool-call") {
          throw new Error(JSON.stringify({
            reason: "invariant (but the second one) server",
            lastEvent,
            expected: 'tool-call',
          }));
        }
        lastEvent.args = JSON.parse(lastEvent.args);
        return prev;
      }

      return [...prev, curr];
    },
    [] as typeof chunks
  );
};

// {
//   "type": "tool-call",
//   "toolCallId": "call_0SWyQCTmMrrXmHZmIjUb3Bf5",
//   "toolName": "writeCode",
//   "args": {
//       "goal": "Transform the current HTML into a high-quality, modern dashboard inspired by Vercel's design. Include a sleek sidebar with navigation (Dashboard, Projects, Analytics, Settings), a top bar with user avatar and notifications, and a main content area with a welcome message, project stats cards, and a recent activity section. Use elegant, dark-themed styles, subtle gradients, and smooth hover effects. Ensure responsive layout and polish all UI elements for a premium feel.",
//       "path": "/Users/robby/zenbu/packages/zenbu-daemon/projects/intrepid-tiger-949/index.html"
//   }
// }
