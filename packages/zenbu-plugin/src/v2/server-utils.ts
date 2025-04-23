import { Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { getGeminiVideoURL } from "./message-ws";
import { accumulateEvents } from "./shared-utils";
// fix later
import { ClientEvent, ModelEvent } from "../../../zenbu-redis/src/redis";
import { CoreMessage } from "ai";

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

                        const bytes = yield* fs.readFile(item.filePath);
                        return {
                          kind: "image" as const,
                          bytes,
                        };
                      }
                      case "video": {
                        const upload = yield* getGeminiVideoURL(item.filePath);
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
              content: [{ type: "text" as const, text: event.text }],
            };
          }
        })
      )
    );

    return coreMessages;

    // const
  });
};
