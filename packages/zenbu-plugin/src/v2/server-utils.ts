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
  const textChunks = chunks.map((chunk) => {
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
