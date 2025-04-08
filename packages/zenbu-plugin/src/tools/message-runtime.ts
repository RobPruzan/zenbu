import {
  AssistantContent,
  CoreMessage,
  generateObject,
  streamText,
  tool,
} from "ai";
import { ChatMessage, toChatMessages } from "../ws/utils.js";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { getTemplatedZenbuPrompt, removeComments } from "../create-server.js";
import {
  EventLogEvent,
  getCodebaseIndexPrompt,
  imageToBytes,
  PluginServerEvent,
} from "../ws/ws.js";
import { nanoid } from "nanoid";
import { smartEdit } from "./good-edit-impl.js";
import { abort, emit } from "node:process";
import { readFile } from "node:fs/promises";
import { google } from "@ai-sdk/google";
import { planner } from "../ws/planner.js";
import { bestEdit } from "./best-edit-impl.js";
import { editFileSpec } from "../ws/apply.js";
import { textEditor } from "./edit/text-editor.js";

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
  const previousChatMessages = toChatMessages(previousEvents, imageToBytes);
  taskSet.add({
    taskId: nanoid(),
    timestamp: Date.now(),
    userMessage: newMessage,
    status: "idle",
  });
  const messages: Array<CoreMessage> = [
    {
      content: await getTemplatedZenbuPrompt(),
      role: "system",
      // role: 'system',
      //   content: 'f'
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
  ];
  const { fullStream } = streamText({
    temperature: 1,
    providerOptions: {
      anthropic: {
        // todo: what does this do
        cacheControl: { type: "ephemeral" },
      },
    },
    model: google("gemini-2.0-flash-exp"),
    maxSteps: 50,
    maxTokens: 8192,
    messages,
    tools: {
      edit_file: tool({
        // description: "",
        parameters: z.object({}),
        execute: async ({}) => {},
      }),
      // pull_task: tool({
      //   // description: "",
      //   parameters: z.object({}),
      //   execute: async ({}) => {
      //     // triggers the multithreading attempt
      //   },
      // }),
      // get_tasks: tool({
      //   // description: "",
      //   parameters: z.object({}),
      //   execute: async ({}) => {},
      // }),
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
  const codebaseIndex = await getCodebaseIndexPrompt();

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
        content: codebaseIndex,
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
          target_file_path: z
            .string()
            .describe(
              "The path of the file that will be edited. Anytime you want to modify a file, you should use this tool, you should never write code yourself, you should always delegate it to this edit tool"
            ),
        }),
        execute: async ({ target_file_path }) => {
          emitEvent("edit file tool");
          const res = await editFileSpec({
            targetFilePath: target_file_path,
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
            // emitEvent,
            emit: emitEvent,
            // targetFile: target_file,

            threadId: null,
          });
          emitEvent("================== EDITING FILE END =============");

          return res;
        },
      }),
      // pull_task: tool({
      //   // description: "",
      //   parameters: z.object({
      //     taskId: z.string(),
      //     lockedFiles: z.array(z.string()),
      //   }),
      //   execute: async ({ taskId, lockedFiles }) => {
      //     emitEvent("pull task");
      //     // triggers the multithreading attempt

      //     const task = Array.from(taskSet.values()).find(
      //       (task) => task.taskId === taskId
      //     );

      //     if (!task) {
      //       emitEvent("errrrrrrrrrrrrrrrrrr");
      //       throw new Error("No task with provided id found");
      //     }

      //     task.status = "executing";
      //     if (task.status !== "executing") {
      //       emitEvent("unreachable");
      //       throw new Error("unreachable");
      //     }

      //     task.lockedFiles = lockedFiles;

      //     parallelizeTaskSet({
      //       chatMessages: toChatMessages(accumulatedTextDeltas),
      //       emitEvent,
      //     }).catch(() => {
      //       /**
      //        *
      //        */
      //     });

      //     return "Successfully pulled task";
      //   },
      // }),
      // get_tasks: tool({
      //   // description: "",
      //   parameters: z.object({}),
      //   execute: async ({}) => {
      //     emitEvent("get tasks");
      //     return getTaskSetAsString();
      //   },
      // }),
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
          threadId: null,
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
  message: CoreMessage;
  previousChatMessages: Array<ChatMessage>;
  requestId: string;
}) => {
  const accumulatedTextDeltas: Array<PluginServerEvent> = [];
  // taskSet.add({
  //   taskId: nanoid(),
  //   timestamp: Date.now(),
  //   userMessage: message,
  //   status: "idle",
  // });

  emitEvent("⚡");
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
      message
      // {
      //   role: "user",
      //   content: getTaskSetAsString(),
      // },
    ],
    toolCallStreaming: true,
    tools: {
      edit_file: tool({
        // description: "",
        // this is kinda wrong
        parameters: z.object({
          target_file_path: z
            .string()
            .describe("The path of the file that will be edited"),
        }),
        execute: async ({ target_file_path }) => {
          emitEvent("edit file tool");

          // this edit strat + prompt is really bad, really bad
          // it should be edits over logical codeblocks, so scope edits to code scopes
          // line number range you select to replace will always be (inclusive, inclusive)
          // batch close scope modification together, but you must select the parent scope in that case
          //

          const assistantAccContent = toChatMessages(
            accumulatedTextDeltas,
            imageToBytes
          )[0].content as AssistantContent;
          const res = await textEditor({
            emit: emitEvent,
            filePath: target_file_path,
            fullChatHistory: [
              ...previousChatMessages,
              // {
              //   role: "user",
              //   content: getTaskSetAsString(),
              // },
              {
                role: "assistant",
                content: assistantAccContent,
              },
              // {
              //   role: "assistant",
              //   content: what,
              //   // content: "f"
              // },
            ],
            writeToPath: target_file_path,
          });
          // const res = await editFileSpec({
          //   chatHistory: [
          //     ...previousChatMessages,
          //     {
          //       role: "data",
          //       content: getTaskSetAsString(),
          //     },
          //     {
          //       role: "assistant",
          //       content: toChatMessages(accumulatedTextDeltas)[0].content,
          //     },
          //   ],
          //   emit: emitEvent,
          //   threadId: null,
          //   targetFilePath: target_file_path,
          // }).catch((e: Error) =>
          //   JSON.stringify({
          //     stack: e.stack,
          //     msg: e.message,
          //   })
          // );
          emitEvent("================== EDITING FILE END =============");

          return res;
        },
      }),
      // pull_task: tool({
      //   // description: "",
      //   parameters: z.object({
      //     taskId: z.string(),
      //     lockedFiles: z.array(z.string()),
      //   }),
      //   execute: async ({ taskId, lockedFiles }) => {
      //     emitEvent("pull task");
      //     // triggers the multithreading attempt

      //     const task = Array.from(taskSet.values()).find(
      //       (task) => task.taskId === taskId
      //     );

      //     if (!task) {
      //       emitEvent("errrrrrrrrrrrrrrrrrr");
      //       throw new Error("No task with provided id found");
      //     }

      //     task.status = "executing";
      //     if (task.status !== "executing") {
      //       emitEvent("unreachable");
      //       throw new Error("unreachable");
      //     }

      //     task.lockedFiles = lockedFiles;

      //     parallelizeTaskSet({
      //       chatMessages: toChatMessages(accumulatedTextDeltas),
      //       emitEvent,
      //     }).catch(() => {
      //       /**
      //        *
      //        */
      //     });

      //     return "Successfully pulled task";
      //   },
      // }),
      // get_tasks: tool({
      //   // description: "",
      //   parameters: z.object({}),
      //   execute: async ({}) => {
      //     emitEvent("get tasks");
      //     return getTaskSetAsString();
      //   },
      // }),
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
          threadId: null,
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

  /**
   *
   * MUST ADD ME:
   * if there are still idle tasks left they must be pulled first
   *
   * (note to self, only user should be able to delete tasks, and it should be very easy in the ui)
   *
   *
   */

  activeStreams.current = activeStreams.current.filter(
    ({ kind }) => kind !== "main-thread"
  );
};
export const chatMessagesToString = (chatMessages: Array<ChatMessage>) => {
  let result = "";

  for (const message of chatMessages) {
    const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
    result += `${role}: ${message.content}\n`;
  }

  return result;
};

export const parallelizeTask = async ({
  chatMessages,
  message,
  emitEvent,
}: {
  chatMessages: Array<ChatMessage>;
  message: string;
  emitEvent: (task: string, threadId: string | null) => void;
}) => {
  const sysPrompt = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/should-parallelize.md",
    "utf-8"
  );

  const { object: canParallelize } = await generateObject({
    model: google("gemini-2.0-pro-exp-02-05"),
    schema: z.boolean(),
    messages: [
      {
        role: "system",
        content: sysPrompt,
      },
      {
        role: "user",
        content: `\
<chat-history>
${chatMessagesToString(chatMessages)}
</chat-history>
<task-set>
${getTaskSetAsString()}
</task-set>
<task-to-analyze>
${message}
</task-to-analyze>
`,
      },
    ],
  });

  emitEvent("GOOGLE, CAN WE PARALLELIZE THIS TASK:" + canParallelize, null);

  if (canParallelize && false) {
    emitEvent("parallel cause google", null);
    spawnThread({
      emitEvent,
      // this may get harry later since we never explicitly put this in the task set, we just immediately create a task inline
      task: {
        taskId: nanoid(),
        status: "idle",
        timestamp: Date.now(),
        userMessage: message,
      },
      existingMessages: chatMessages,
    });
    return;
  }

  taskSet.add({
    status: "idle",
    taskId: nanoid(),
    timestamp: Date.now(),
    userMessage: message,
  });
};

export const parallelizeTaskSet = async ({
  chatMessages,
  emitEvent,
}: {
  chatMessages: Array<ChatMessage>;
  emitEvent: (task: string) => void;
}) => {
  const sysPrompt = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/should-parallelize-all.md",
    "utf-8"
  );

  const { object: parallelizableTasks } = await generateObject({
    model: google("gemini-2.0-pro-exp-02-05"),
    schema: z.array(z.string()),
    messages: [
      {
        role: "system",
        content: sysPrompt,
      },
      {
        role: "user",
        content: `\
<chat-history>
${chatMessagesToString(chatMessages)}
</chat-history>
<task-set>
${getTaskSetAsString()}
</task-set>
`,
      },
    ],
  });

  const tasks = [...taskSet.values()].filter((task) =>
    parallelizableTasks.includes(task.taskId)
  );

  tasks.forEach((task) => {
    return;
    spawnThread({
      emitEvent,
      // this will 100% lead to a bug, i'm not thinking about which messages are inside here and what i want the agent to see
      existingMessages: chatMessages,
      task,
    });
  });
};

export const spawnThread = async ({
  emitEvent,
  task,
  existingMessages,
}: {
  emitEvent: (text: string, threadId: string | null) => void;
  task: TaskSetItem;
  existingMessages: Array<ChatMessage>;
}) => {
  const accumulatedTextDeltas: Array<PluginServerEvent> = [];
  const abortController = new AbortController();
  const sysPrompt = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/thread-prompt-v2.md",
    "utf-8"
  ).then(removeComments);

  const threadId = nanoid();

  const { fullStream } = await streamText({
    model: google("gemini-2.0-flash-exp"),
    toolCallStreaming: true,
    abortSignal: abortController.signal,
    tools: {
      edit_file: tool({
        // description: "",
        parameters: z.object({
          target_file: z.string().describe("File to edit"),
        }),
        execute: async ({ target_file }) => {
          emitEvent("edit file tool", threadId);
          const res = await bestEdit({
            chatHistory: [
              ...existingMessages,
              {
                role: "user",
                content: task.userMessage,
              },

              // {
              //   role: "assistant",
              //   content: toChatMessages(accumulatedTextDeltas)[0].content,
              // },
            ],
            emitEvent,
            threadId,
            targetFile: target_file,
          });
          emitEvent(
            "================== EDITING FILE END =============",
            threadId
          );

          return res;
        },
      }),
    },

    messages: [
      {
        role: "system",
        content: sysPrompt,
      },
      {
        // probably should re-use a cache and use chat history updates as updates to index implicitly

        // threads may be infrequent enough that this is optimal
        content: await getCodebaseIndexPrompt(),
        role: "system",
      },
      {
        role: "user",
        content: `\
<chat-history>
${chatMessagesToString(
  existingMessages.filter((message) => message.role === "system")
)}        
</chat-history>
`,
      },
      {
        role: "user",
        content: task.userMessage,
      },

      // ...existingMessages.filter(message => message.role === 'system')
    ],
  });

  for await (const obj of fullStream) {
    switch (obj.type) {
      case "tool-call-delta": {
        emitEvent(obj.argsTextDelta, threadId);
        break;
      }
      case "error": {
        emitEvent(`Error: ${(obj.error as Error).message}`, threadId);
        break;
      }
      case "redacted-reasoning": {
        emitEvent(`Redacted reasoning: ${obj.data}`, threadId);
        break;
      }
      case "reasoning": {
        emitEvent(obj.textDelta, threadId);
        break;
      }
      case "tool-call": {
        emitEvent(`Tool call: ${obj.toolName}`, threadId);
        break;
      }
      case "tool-result": {
        emitEvent(`Tool result: ${JSON.stringify(obj.result)}`, threadId);
        break;
      }
      case "text-delta": {
        accumulatedTextDeltas.push({
          kind: "assistant-simple-message",
          associatedRequestId: "thread-stuff-todo-not-implemented",
          text: obj.textDelta,
          timestamp: Date.now(),
          id: crypto.randomUUID(),
          threadId,
        });
        emitEvent(obj.textDelta, threadId);
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
        emitEvent("Finished reason:" + obj.finishReason, threadId);
        break;
      }
      case "tool-call-streaming-start": {
        emitEvent(`Starting tool call: ${obj.toolName}`, threadId);
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
};

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
