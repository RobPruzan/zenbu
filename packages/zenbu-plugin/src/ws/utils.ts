import { CoreMessage, Message } from "ai";
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

export const toChatMessages = (inEvents: Array<EventLogEvent>) => {
  const messages: Array<Omit<Message, "id">> = [];
  const processedIndices = new Set<number>();
  inEvents.forEach((event, index) => {
    if (processedIndices.has(index)) {
      return;
    }

    switch (event.kind) {
      case "user-message": {
        messages.push({
          role: "user",
          content: event.text,
        });
        processedIndices.add(index);
        return;
      }
      case "assistant-simple-message": {
        const acc: Omit<Message, "id"> = {
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
export const toGroupedChatMessages = (events: Array<EventLogEvent>) => {
  // console.log("in events", events);

  const { mainThread: mainThreadEvents, ...threads } = intoGroups(events);

  // console.log("wut", Object.keys(threads));
  const mainThreadMessages = toChatMessages(mainThreadEvents);

  const otherThreadsMessages = Object.keys(threads)
    .map((threadId) => threads[threadId])

    .map(toChatMessages);

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
