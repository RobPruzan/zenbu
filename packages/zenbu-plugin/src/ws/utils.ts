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

export const toChatMessages = async (
  inEvents: Array<EventLogEvent>,
  sync: boolean,
  toImage: (path: string) => Promise<DataContent> | URL = (path) =>
    new URL(`http://localhost:5001/image/${path}`),
  toVideo: (
    path: string
  ) => Promise<{ data: DataContent | URL; mimeType: string }> = async (
    path: string
  ) => ({
    data: new URL(`http://localhost:5001/video/${path}`),
    mimeType: "video/webm",
  })
) => {
  const messages: Array<CoreMessage> = [];
  const processedIndices = new Set<number>();
  // gahh we need ordering or else this gets all fucked
  // timestamp needs to be sent on the message that's bare minimum
  // why

  const inner = async (event: EventLogEvent, index: number) => {
    if (processedIndices.has(index)) {
      return;
    }

    switch (event.kind) {
      case "user-message": {
        // todo generalize to multiple inputs
        const first = event.context.find((item) => item.kind === "image");
        const firstVideo = event.context.find((item) => item.kind === "video");
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
        if (firstVideo) {
          const { data, mimeType } = await toVideo(firstVideo.filePath);
          const message: CoreMessage = {
            role: "user",
            content: [
              {
                type: "file",
                data,
                mimeType,
                // image: await readFile(`.zenbu/screenshots/${first.filePath}`),
                // image: `.zenbu/screenshots/${first.filePath}`,
                // image: await toImage(first.filePath),
                // data: geminiFile.file.uri,
                // mimeType: geminiFile.file.mimeType,
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
  };

  if (sync) {
    for (let index = 0; index < inEvents.length; index++) {
      const event = inEvents[index];
      await inner(event, index);
    }
  } else {
    await Promise.all(inEvents.map(inner));
  }

  return messages;
};

export const toGroupedChatMessages = async (
  events: Array<EventLogEvent>,
  sync: boolean,
  toImage: (path: string) => Promise<DataContent> | URL = (path) =>
    new URL(`http://localhost:5001/image/${path}`),

  toVideo: (
    path: string
  ) => Promise<{ data: DataContent | URL; mimeType: string }> = async (
    path: string
  ) => ({
    data: new URL(`http://localhost:5001/video/${path}`),
    mimeType: "video/webm",
  })
) => {
  // console.log("in events", events);

  const { mainThread: mainThreadEvents, ...threads } = intoGroups(events);

  const mainThreadMessages = await toChatMessages(
    mainThreadEvents,
    sync,
    toImage,
    toVideo
  );

  // console.log("wut", mainThreadMessages, mainThreadMessages.length, mainThreadMessages.slice());

  const otherThreadsMessages = await Promise.all(
    Object.keys(threads)
      .map((threadId) => threads[threadId])

      .map((item) => toChatMessages(item, sync, toImage, toVideo))
  );

  return { mainThreadMessages, otherThreadsMessages };
};

export type ChatMessage = Awaited<
  ReturnType<typeof toGroupedChatMessages>
>["mainThreadMessages"][number];

export const removeMarkdownComments = (content: string): string => {
  let result = content.replace(/^\/\/.*$/gm, "");

  result = result.replace(/<!--[\s\S]*?-->/g, "");

  return result;
};
