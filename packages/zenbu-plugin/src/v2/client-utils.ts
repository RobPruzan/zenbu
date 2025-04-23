import { Effect } from "effect";
import { ClientEvent, ModelEvent, accumulateEvents } from "./shared-utils";
import { CoreMessage } from "ai";

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
              content: [{ type: "text" as const, text: event.text }],
            };
          }
        })
      )
    );

    return coreMessages;
  });
};
