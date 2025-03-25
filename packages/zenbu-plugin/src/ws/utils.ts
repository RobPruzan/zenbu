import { CoreMessage, Message } from "ai";
import { EventLogEvent } from "./ws.js";
export const toChatMessages = (events: Array<EventLogEvent>) => {
  const messages: Array<Omit<Message, "id">> = [];
  const processedIndices = new Set<number>();

  events.forEach((event, index) => {
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
        const endAt = events.findIndex(
          (e, i) => i > index && e.kind === "user-message"
        );

        const localEvents = events.slice(
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

export type ChatMessage = ReturnType<typeof toChatMessages>[number];

export const removeMarkdownComments = (content: string): string => {
  let result = content.replace(/^\/\/.*$/gm, "");

  result = result.replace(/<!--[\s\S]*?-->/g, "");

  return result;
};
