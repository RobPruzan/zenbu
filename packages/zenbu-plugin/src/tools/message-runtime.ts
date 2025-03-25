import { streamText, tool } from "ai";
import { ChatMessage, toChatMessages } from "../ws/utils.js";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { getTemplatedZenbuPrompt } from "../create-server.js";
import {
  EventLogEvent,
  getCodebaseIndexPrompt,
  PluginServerEvent,
} from "../ws/ws.js";
import { nanoid } from "nanoid";
import { smartEdit } from "./good-edit-impl.js";
import { abort, emit } from "node:process";

// actually the main thread should definitely be scoped to the socket room itself, not to the message...
/**
 *
 * what we need to be able to test this e2e and see if it actually works:
 * - create a global runtime for the main thread of execution
 * - be able to access the abort signal to cancel that thread of execution entirely
 * - be able to access the live chat history immediately (we immediately sync plugin server events, when user sends we just entirely replace)
 * - we need a router model to determine if it should create a task, or interrupt model with info
 *   - this part is the most tricky to get right, maybe we should make this UX instead
 *   - send new task to run, or just interrupt model with info
 *   - yeah maybe we don't do a router and we just do UX
 * -
 */
export const handleMessage = async ({
  emitEvent,
  newMessage,
  previousEvents,
}: {
  emitEvent: (text: string) => void;
  previousEvents: Array<EventLogEvent>;
  newMessage: string;
}) => {
  const accumulatedTextDeltas: Array<PluginServerEvent> = [];
  const previousChatMessages = toChatMessages(previousEvents);
  taskSet.add({
    taskId: nanoid(),
    timestamp: Date.now(),
    userMessage: newMessage,
    status: "idle",
  });
  const { fullStream } = streamText({
    temperature: 1,
    providerOptions: {
      anthropic: {
        // todo: what does this do
        cacheControl: { type: "ephemeral" },
      },
    },
    model: anthropic("claude-3-5-sonnet-latest"),
    maxSteps: 50,
    maxTokens: 8192,
    messages: [
      {
        content: await getTemplatedZenbuPrompt(),
        role: "system",
      },
      {
        content: await getCodebaseIndexPrompt(),
        role: "system",
      },
      ...previousChatMessages,
      {
        role: "data",
        content: getTaskSetAsString(),
      },
    ],
    tools: {
      edit_file: tool({
        // description: "",
        parameters: z.object({}),
        execute: async ({}) => {},
      }),
      pull_task: tool({
        // description: "",
        parameters: z.object({}),
        execute: async ({}) => {
          // triggers the multithreading attempt
        },
      }),
      get_tasks: tool({
        // description: "",
        parameters: z.object({}),
        execute: async ({}) => {},
      }),
    },
  });
};

export let activeStreams: {
  current: Array<{
    abort: () => void;
    kind: "main-thread";
  }>;
} = { current: [] };

let roomEvents: Array<EventLogEvent> = [];

type TaskSetItem =
  | {
      timestamp: number;
      userMessage: string;
      taskId: string;
      status: "idle" | "error";
    }
  | {
      status: "executing";
      timestamp: number;
      userMessage: string;
      taskId: string;
      lockedFiles: Array<string>;
    };
export const taskSet = new Set<TaskSetItem>();
/**
 * main thread message cases:
 * - no ongoing generation, implicitly create a task for the model
 * - ongoing generation, send the raw user message
 * -
 *
 */

export const sendActiveMainThreadMessage = async ({
  emitEvent,
  message,
  previousChatMessages,
  requestId,
}: {
  emitEvent: (text: string) => void;
  message: string;
  previousChatMessages: Array<ChatMessage>;
  requestId: string;
}) => {
  const accumulatedTextDeltas: Array<PluginServerEvent> = [];
  const abortController = new AbortController();
  const { fullStream } = streamText({
    temperature: 1,
    abortSignal: abortController.signal,
    providerOptions: {
      anthropic: {
        // todo: what does this do
        cacheControl: { type: "ephemeral" },
      },
    },
    model: anthropic("claude-3-5-sonnet-latest"),
    maxSteps: 50,
    maxTokens: 8192,
    messages: [
      {
        content: await getTemplatedZenbuPrompt(),
        role: "system",
      },
      {
        content: await getCodebaseIndexPrompt(),
        role: "system",
      },
      ...previousChatMessages,
      {
        role: "user",
        content: getTaskSetAsString(),
      },
    ],
    toolCallStreaming: true,
    tools: {
      edit_file: tool({
        // description: "",
        parameters: z.object({
          target_file: z.string().describe("File to edit"),
        }),
        execute: async ({ target_file }) => {
          emitEvent("edit file tool");
          const res = await smartEdit({
            chatHistory: [
              ...previousChatMessages,
              {
                role: "user",
                content: message,
              },

              // {
              //   role: "assistant",
              //   content: toChatMessages(accumulatedTextDeltas)[0].content,
              // },
            ],
            onChunk: (chunk) => {
              emitEvent(chunk);
            },
            targetFile: target_file,
          });
          emitEvent("================== EDITING FILE END =============");

          return res;
        },
      }),
      pull_task: tool({
        // description: "",
        parameters: z.object({
          taskId: z.string(),
          lockedFiles: z.array(z.string()),
        }),
        execute: async ({ taskId, lockedFiles }) => {
          emitEvent("pull task");
          // triggers the multithreading attempt

          const task = Array.from(taskSet.values()).find(
            (task) => task.taskId === taskId
          );

          if (!task) {
            emitEvent("errrrrrrrrrrrrrrrrrr");
            throw new Error("No task with provided id found");
          }

          task.status = "executing";
          if (task.status !== "executing") {
            emitEvent("unreachable");
            throw new Error("unreachable");
          }

          task.lockedFiles = lockedFiles;

          parallelizeTaskSetIfPossible().catch(() => {
            /**
             *
             */
          });

          return "Successfully pulled task";
        },
      }),
      get_tasks: tool({
        // description: "",
        parameters: z.object({}),
        execute: async ({}) => {
          emitEvent("get tasks");
          return getTaskSetAsString();
        },
      }),
    },
  });

  activeStreams.current.push({
    abort: () => abortController.abort(),
    kind: "main-thread",
  });

  for await (const obj of fullStream) {
    switch (obj.type) {
      case "tool-call-delta": {
        emitEvent(obj.argsTextDelta);
        break;
      }
      case "error": {
        emitEvent(`Error: ${(obj.error as Error).message}`);
        break;
      }
      case "redacted-reasoning": {
        emitEvent(`Redacted reasoning: ${obj.data}`);
        break;
      }
      case "reasoning": {
        emitEvent(obj.textDelta);
        break;
      }
      case "tool-call": {
        emitEvent(`Tool call: ${obj.toolName}`);
        break;
      }
      case "tool-result": {
        emitEvent(`Tool result: ${JSON.stringify(obj.result)}`);
        break;
      }
      case "text-delta": {
        accumulatedTextDeltas.push({
          kind: "assistant-simple-message",
          associatedRequestId: requestId,
          text: obj.textDelta,
          timestamp: Date.now(),
          id: crypto.randomUUID(),
        });
        emitEvent(obj.textDelta);
        break;
      }
      // case "reasoning-signature": {
      //   emitEvent(`Reasoning signature: ${obj.signature}`);
      //   break;
      // }
      // case "source": {
      //   emitEvent(`Source: ${obj.source}`);
      //   break;
      // }
      case "finish": {
        emitEvent("Finished reason:" + obj.finishReason);
        break;
      }
      case "tool-call-streaming-start": {
        emitEvent(`Starting tool call: ${obj.toolName}`);
        break;
      }
      // case "step-start": {
      //   emitEvent(`Step started: ${obj.request.body}`);
      //   break;
      // }
      // case "step-finish": {
      //   emitEvent(`Step finished: ${obj.finishReason}`);
      //   break;
      // }
    }

    // console.log(textPart);
  }

  activeStreams.current = activeStreams.current.filter(
    ({ kind }) => kind !== "main-thread"
  );
};

export const sendIdleMainThreadMessage = async ({
  emitEvent,
  message,
  previousChatMessages,
  requestId,
}: {
  emitEvent: (text: string) => void;
  message: string;
  previousChatMessages: Array<ChatMessage>;
  requestId: string;
}) => {
  const accumulatedTextDeltas: Array<PluginServerEvent> = [];
  taskSet.add({
    taskId: nanoid(),
    timestamp: Date.now(),
    userMessage: message,
    status: "idle",
  });

  emitEvent("creating stream");
  const abortController = new AbortController();

  const { fullStream } = streamText({
    temperature: 1,
    abortSignal: abortController.signal,
    providerOptions: {
      anthropic: {
        // todo: what does this do
        cacheControl: { type: "ephemeral" },
      },
    },
    model: anthropic("claude-3-5-sonnet-latest"),
    maxSteps: 50,
    maxTokens: 8192,
    messages: [
      {
        content: await getTemplatedZenbuPrompt(),
        role: "system",
      },
      {
        content: await getCodebaseIndexPrompt(),
        role: "system",
      },
      ...previousChatMessages,
      {
        role: "user",
        content: getTaskSetAsString(),
      },
    ],
    toolCallStreaming: true,
    tools: {
      edit_file: tool({
        // description: "",
        parameters: z.object({
          target_file: z.string().describe("File to edit"),
        }),
        execute: async ({ target_file }) => {
          emitEvent("edit file tool");
          const res = await smartEdit({
            chatHistory: [
              ...previousChatMessages,
              {
                role: "data",
                content: getTaskSetAsString(),
              },
              {
                role: "assistant",
                content: toChatMessages(accumulatedTextDeltas)[0].content,
              },
            ],
            onChunk: (chunk) => {
              emitEvent(chunk);
            },
            targetFile: target_file,
          });
          emitEvent("================== EDITING FILE END =============");

          return res;
        },
      }),
      pull_task: tool({
        // description: "",
        parameters: z.object({
          taskId: z.string(),
          lockedFiles: z.array(z.string()),
        }),
        execute: async ({ taskId, lockedFiles }) => {
          emitEvent("pull task");
          // triggers the multithreading attempt

          const task = Array.from(taskSet.values()).find(
            (task) => task.taskId === taskId
          );

          if (!task) {
            emitEvent("errrrrrrrrrrrrrrrrrr");
            throw new Error("No task with provided id found");
          }

          task.status = "executing";
          if (task.status !== "executing") {
            emitEvent("unreachable");
            throw new Error("unreachable");
          }

          task.lockedFiles = lockedFiles;

          parallelizeTaskSetIfPossible().catch(() => {
            /**
             *
             */
          });

          return "Successfully pulled task";
        },
      }),
      get_tasks: tool({
        // description: "",
        parameters: z.object({}),
        execute: async ({}) => {
          emitEvent("get tasks");
          return getTaskSetAsString();
        },
      }),
    },
  });

  activeStreams.current.push({
    abort: () => abortController.abort(),
    kind: "main-thread",
  });

  for await (const obj of fullStream) {
    switch (obj.type) {
      case "tool-call-delta": {
        emitEvent(obj.argsTextDelta);
        break;
      }
      case "error": {
        emitEvent(`Error: ${(obj.error as Error).message}`);
        break;
      }
      case "redacted-reasoning": {
        emitEvent(`Redacted reasoning: ${obj.data}`);
        break;
      }
      case "reasoning": {
        emitEvent(obj.textDelta);
        break;
      }
      case "tool-call": {
        emitEvent(`Tool call: ${obj.toolName}`);
        break;
      }
      case "tool-result": {
        emitEvent(`Tool result: ${JSON.stringify(obj.result)}`);
        break;
      }
      case "text-delta": {
        accumulatedTextDeltas.push({
          kind: "assistant-simple-message",
          associatedRequestId: requestId,
          text: obj.textDelta,
          timestamp: Date.now(),
          id: crypto.randomUUID(),
        });
        emitEvent(obj.textDelta);
        break;
      }
      // case "reasoning-signature": {
      //   emitEvent(`Reasoning signature: ${obj.signature}`);
      //   break;
      // }
      // case "source": {
      //   emitEvent(`Source: ${obj.source}`);
      //   break;
      // }
      case "finish": {
        emitEvent("Finished reason:" + obj.finishReason);
        break;
      }
      case "tool-call-streaming-start": {
        emitEvent(`Starting tool call: ${obj.toolName}`);
        break;
      }
      // case "step-start": {
      //   emitEvent(`Step started: ${obj.request.body}`);
      //   break;
      // }
      // case "step-finish": {
      //   emitEvent(`Step finished: ${obj.finishReason}`);
      //   break;
      // }
    }

    // console.log(textPart);
  }

  activeStreams.current = activeStreams.current.filter(
    ({ kind }) => kind !== "main-thread"
  );
};

export const parallelizeTaskSetIfPossible = async () => null;

export const spawnThread = ({
  emitEvent,
}: {
  emitEvent: (text: string) => void;
}) => {};

export const getTaskSetAsString = () => {
  const asArr = [...taskSet.values()];

  // ascending order here is explicit so the model sees the oldest tasks first
  const byTime = asArr.sort((a, b) => a.timestamp - b.timestamp);

  let acc = "[LATEST TASK SET]\N";

  byTime.forEach((task) => {
    acc += "--------TASK START---------";
    acc += "User Message:" + task.userMessage;
    acc +=
      "Seconds ago task was made:" +
      ((Date.now() - task.timestamp) / 1000).toFixed(2);
    acc += "Task ID:" + task.taskId;
    acc += "--------TASK END---------";
  });
  return acc;
};

export const iife = <T>(f: () => T) => f();
