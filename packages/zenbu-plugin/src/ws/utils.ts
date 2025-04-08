import { CoreMessage, DataContent, Message } from "ai";
import { EventLogEvent, PluginServerEvent } from "./ws.js";
// what if we apply the same processing, but just split the arrays into groups of request ids pairs and order
// we could just attach a thread id to the event log and call it a day

/**
 * okay now we have the thread is, so we can group thread messages into array groups
 */

const intoGroups = (events: Array<EventLogEvent>) => {
  const groups: Record<"mainThread" | (string & {}), Array<EventLogEvent>> = {
    mainThread: [],
  };

  events.forEach((event) => {
    if (event.kind !== "assistant-simple-message" || event.threadId === null) {
      groups["mainThread"].push(event);
      return;
    }

    let thread = groups[event.threadId];

    if (!thread) {
      const threadGroup: Array<PluginServerEvent> = [];
      groups[event.threadId] = threadGroup;
      thread = threadGroup;
    }

    thread.push(event);
  });

  return groups;
};

export const toChatMessages = (
  inEvents: Array<EventLogEvent>,
  toImage: (path: string) => Promise<DataContent> | URL = (path) =>
    new URL(`http://localhost:5001/image/${path}`)
) => {
  const messages: Array<CoreMessage> = [];
  const processedIndices = new Set<number>();
  inEvents.forEach(async (event, index) => {
    if (processedIndices.has(index)) {
      return;
    }

    switch (event.kind) {
      case "user-message": {
        const first = event.context.find((item) => item.kind === "image");
        if (first) {

          const message: CoreMessage = {
            role: "user",
            content: [
              {
                type: "image",
                // image: await readFile(`.zenbu/screenshots/${first.filePath}`),
                // image: `.zenbu/screenshots/${first.filePath}`,
                image: await toImage(first.filePath),
              },
              {
                type: "text",
                text: event.text,
              },
            ],
          };
          messages.push(message);
          return;
        }
        messages.push({
          role: "user",
          content: event.text,
        });
        processedIndices.add(index);
        return;
      }
      case "assistant-simple-message": {
        const acc: CoreMessage = {
          role: "assistant",
          content: "",
        };
        const endAt = inEvents.findIndex(
          (e, i) => i > index && e.kind === "user-message"
        );

        const localEvents = inEvents.slice(
          index,
          endAt === -1 ? undefined : endAt
        );

        localEvents.forEach((event, localIndex) => {
          if (event.kind === "assistant-simple-message") {
            acc.content += event.text;
            processedIndices.add(index + localIndex);
          }
        });

        messages.push(acc);
        return;
      }
    }
  });
  return messages;
};
export const toGroupedChatMessages = (
  events: Array<EventLogEvent>,
  toImage: (path: string) => Promise<DataContent> | URL = (path) =>
    new URL(`http://localhost:5001/image/${path}`)
) => {
  // console.log("in events", events);

  const { mainThread: mainThreadEvents, ...threads } = intoGroups(events);

  // console.log("wut", Object.keys(threads));
  const mainThreadMessages = toChatMessages(mainThreadEvents, toImage);

  const otherThreadsMessages = Object.keys(threads)
    .map((threadId) => threads[threadId])

    .map((item) => toChatMessages(item, toImage));

  return { mainThreadMessages, otherThreadsMessages };
};

export type ChatMessage = ReturnType<
  typeof toGroupedChatMessages
>["mainThreadMessages"][number];

export const removeMarkdownComments = (content: string): string => {
  let result = content.replace(/^\/\/.*$/gm, "");

  result = result.replace(/<!--[\s\S]*?-->/g, "");

  return result;
};
