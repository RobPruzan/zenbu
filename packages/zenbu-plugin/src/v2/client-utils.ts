import { Effect } from "effect";
import { accumulateEvents } from "./shared-utils";
import { CoreMessage, TextStreamPart } from "ai";
import { ClientEvent, ModelEvent } from "../../../zenbu-redis/src/redis";

export const client_eventToMessages = (
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
                        return {
                          kind: "image" as const,
                          url: new URL(
                            `http://localhost:5001/image/${item.filePath}`
                          ),
                        };
                      }
                      case "video": {
                        return {
                          kind: "video" as const,
                          url: new URL(
                            `http://localhost:5001/video/${item.filePath}`
                          ),
                          mimeType: "video/webm",
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
                      return { type: "image" as const, image: item.url };
                    }
                    case "video": {
                      return {
                        type: "file" as const,
                        data: item.url,
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
      default:
        return;
    }
  });

  let acc = "";
  textChunks.forEach((chunk) => (acc += chunk));
  return acc;
};
