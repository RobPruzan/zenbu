import { anthropic } from "@ai-sdk/anthropic";
import { CoreMessage, generateText, streamObject, streamText, tool } from "ai";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import { z } from "zod";
import { ChatMessage, toChatMessages } from "./utils.js";
import { getTemplatedZenbuPrompt, removeComments } from "../create-server.js";
import { codeBaseSearch, indexCodebase } from "../tools/code-base-search.js";
import { readFile, writeFile } from "node:fs/promises";
import { editFile } from "../tools/edit.js";
/**
 *
 *
 * plan, we are a websocket that people can connect to, and write to a database (batch and flush)
 *
 *
 * the client will connect to the websocket
 *
 * we will use react query initial data without refetching, then optimistic update the cache with the updates
 *
 *
 * we could model it as an event log? might make undo and debuggability nice?
 *
 *
 * yeah nice we can point the sqlite db either at remote or local that's nice
 *
 *
 */
export type EventLogEvent = ClientEvent | PluginServerEvent;

export type ClientEvent = {
  id: string;
  kind: "user-message";
  context: any;
  text: string;
  requestId: string;
  timestamp: number;
  previousEvents: Array<EventLogEvent>;
};

export type PluginServerEvent = {
  id: string;
  // hm if we want to progressively stream this and correctly render this we need ordering from the timestamp
  // and then we need to correctly render based on that order (for things like when we enter the next visual state)
  // has to be flat, not json structure
  kind: "assistant-simple-message";
  text: string;
  associatedRequestId: string;
  timestamp: number;
};

export const HARD_CODED_USER_PROJECT_PATH =
  "/Users/robby/zenbu/packages/examples/iframe-website";

const pendingEvents: Array<EventLogEvent> = [];

const startFlushInterval = () => {};

// i probably shouldn't couple events gr

// i will need to couple in event log, but i shouldn't couple the types themselves

const CODEBASE_INDEX_PROMPT_PATH =
  "/Users/robby/zenbu/packages/zenbu-plugin/src/codebase-index.md";
let codebaseIndexPromptCache: string | null = null;

export const getCodebaseIndexPrompt = async () => {
  if (codebaseIndexPromptCache) {
    return codebaseIndexPromptCache;
  }

  const prompt = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/codebase-index.md",
    "utf-8"
  );

  const templated = prompt.replace("{codebaseString}", await indexCodebase());
  codebaseIndexPromptCache = templated;

  return templated;
};

export const editThreadPrompt = async ({
  targetFile,
  chatHistory,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) => {
  const systemPrompt = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/thread-prompt.md",
    "utf-8"
  ).then((value) => removeComments(value));

  const templated = systemPrompt
    .replace("{targetFile}", targetFile)
    .replace("{existingChatHistory}", JSON.stringify(chatHistory));

  return templated;
};

export const injectWebSocket = (server: HttpServer) => {
  const ioServer = new Server(server, {
    path: "/ws",
    serveClient: false,
    cors: {
      origin: "*", // narrow later
      methods: ["GET", "POST"],
    },
    // pingInterval: 2000,
    // pingTimeout: 2000,
    transports: ["websocket"],
  });

  ioServer.use(async (socket, next) => {
    next();
  });

  ioServer.on("connection", async (socket) => {
    const roomId = socket.handshake.query.roomId as string;
    console.log("did we get a room id?", roomId);

    if (!roomId) {
      throw new Error("Invariant: roomId is required for socket connection");
    }

    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // emitAssistantMessage({
    //   ioServer,
    //   requestId: "fake",
    //   roomId,
    //   text: await getCodebaseIndexPrompt(),
    // });

    socket.on("message", async (event: ClientEvent) => {
      const accumulatedTextDeltas: Array<PluginServerEvent> = [];
      const { fullStream } = streamText({
        // todo: determine good temperature, and expose this to user with semantic meaning (temperature is awful- how about re-roll)
        temperature: 1,

        model: anthropic("claude-3-5-sonnet-latest"),
        providerOptions: {
          anthropic: {
            // todo: what does this do
            cacheControl: { type: "ephemeral" },
          },
        },

        messages: [
          {
            content: await getTemplatedZenbuPrompt(),
            role: "system",
          },
          {
            content: await getCodebaseIndexPrompt(),
            role: "system",
          },

          ...toChatMessages(event.previousEvents),
          {
            role: "user",
            content: event.text,
          },
        ],
        maxSteps: 1,
        toolCallStreaming: true,
        onChunk: (chunk) => {
          console.log("full chunk", chunk);
        },
        tools: {
          codebase_search: tool({
            description:
              "Find snippets of code from the codebase most relevant to the search query.\nThis is a semantic search tool, so the query should ask for something semantically matching what is needed.\nIf it makes sense to only search in particular directories, please specify them in the target_directories field.\nUnless there is a clear reason to use your own search query, please just reuse the user's exact query with their wording.\nTheir exact wording/phrasing can often be helpful for the semantic search query. Keeping the same exact question format can also be helpful.",
            parameters: z.object({
              query: z
                .string()
                .describe("The search query to find relevant code"),
              explanation: z
                .string()
                .describe(
                  "One sentence explanation why this tool is being used"
                ),
              // target_directories: z
              //   .string()
              //   .describe("Glob patterns for directories to search over"),
            }),
            execute: async (
              {
                query,
                explanation,

                // target_directories
              },
              options
            ) => {
              emitAssistantMessage({
                ioServer,
                requestId: event.requestId,
                roomId,
                text: "========Searching codebase..===========.",
              });
              const result = await codeBaseSearch({
                explanation,
                path: HARD_CODED_USER_PROJECT_PATH,
                query,
              });

              emitAssistantMessage({
                ioServer,
                requestId: event.requestId,
                roomId,
                text:
                  "===========Completed search===========\n" +
                  result +
                  "=================",
              });
              const { searchResult } = result;
              const contentExplanationArray = await Promise.all(
                searchResult.object.map(async ({ path, explanation }) => {
                  try {
                    const content = await readFile(path, "utf-8");
                    return { content, explanation, path };
                  } catch (error) {
                    console.error(`Error reading file ${path}:`, error);
                    return { content: "", explanation, path };
                  }
                })
              );
              // Implementation will go here
              return contentExplanationArray;
            },
            experimental_toToolResultContent: (result) => {
              return [];
            },
          }),
          // read_file: tool({
          //   description:
          //     "Read the contents of a file. The output will be the 1-indexed file contents from start_line to end_line inclusive, with a summary of lines outside that range.\nNote that this call can view at most 250 lines at a time.\n\nWhen using this tool to gather information, it's your responsibility to ensure you have the COMPLETE context. Specifically, each time you call this command you should:\n1) Assess if the contents you viewed are sufficient to proceed with your task.\n2) Take note of where there are lines not shown.\n3) If the file contents you have viewed are insufficient, and you suspect they may be in lines not shown, proactively call the tool again to view those lines.\n4) When in doubt, call this tool again to gather more information. Remember that partial file views may miss critical dependencies, imports, or functionality.",
          //   parameters: z.object({
          //     relative_workspace_path: z.string().describe("Path to file"),
          //     start_line_one_indexed: z.number().describe("Start line number"),
          //     end_line_one_indexed_inclusive: z
          //       .number()
          //       .describe("End line number"),
          //     should_read_entire_file: z
          //       .boolean()
          //       .describe("Whether to read entire file"),
          //     explanation: z.string().describe("One sentence explanation"),
          //   }),
          //   execute: async (
          //     {
          //       relative_workspace_path,
          //       start_line_one_indexed,
          //       end_line_one_indexed_inclusive,
          //       should_read_entire_file,
          //       explanation,
          //     },
          //     options
          //   ) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),
          // run_terminal_cmd: tool({
          //   description:
          //     "PROPOSE a command to run on behalf of the user.\nIf you have this tool, note that you DO have the ability to run commands directly on the USER's system.\nNote that the user will have to approve the command before it is executed.\nThe user may reject it if it is not to their liking, or may modify the command before approving it. If they do change it, take those changes into account.\nThe actual command will NOT execute until the user approves it. The user may not approve it immediately. Do NOT assume the command has started running.\nIf the step is WAITING for user approval, it has NOT started running.",
          //   parameters: z.object({
          //     command: z.string().describe("The terminal command to execute"),
          //     explanation: z.string().describe("One sentence explanation"),
          //     is_background: z
          //       .boolean()
          //       .describe("Whether to run in background"),
          //     require_user_approval: z
          //       .boolean()
          //       .describe("Whether user must approve"),
          //   }),
          //   execute: async (
          //     { command, explanation, is_background, require_user_approval },
          //     options
          //   ) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),
          // list_dir: tool({
          //   description:
          //     "List the contents of a directory. The quick tool to use for discovery, before using more targeted tools like semantic search or file reading. Useful to try to understand the file structure before diving deeper into specific files. Can be used to explore the codebase.",
          //   parameters: z.object({
          //     relative_workspace_path: z.string().describe("Path to list"),
          //     explanation: z.string().describe("One sentence explanation"),
          //   }),
          //   execute: async (
          //     { relative_workspace_path, explanation },
          //     options
          //   ) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),
          // grep_search: tool({
          //   description:
          //     "Fast text-based regex search that finds exact pattern matches within files or directories, utilizing the ripgrep command for efficient searching.\nResults will be formatted in the style of ripgrep and can be configured to include line numbers and content.\nTo avoid overwhelming output, the results are capped at 50 matches.\nUse the include or exclude patterns to filter the search scope by file type or specific paths.",
          //   parameters: z.object({
          //     query: z.string().describe("Regex pattern to search for"),
          //     explanation: z.string().describe("One sentence explanation"),
          //     case_sensitive: z.boolean().describe("Whether case sensitive"),
          //     include_pattern: z.string().describe("Files to include"),
          //     exclude_pattern: z.string().describe("Files to exclude"),
          //   }),
          //   execute: async (
          //     {
          //       query,
          //       explanation,
          //       case_sensitive,
          //       include_pattern,
          //       exclude_pattern,
          //     },
          //     options
          //   ) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),

          edit_file: tool({
            description:
              "Use this tool to request another AI agent implements an edit on a target_file given the context of the previous chat history. You just need to provide the target_path, and another model will handle implementing the change that you want (because it reads the full chat history, and is the same model as you, think of it like it's reading your mind)",
            parameters: z.object({
              target_file: z.string().describe("File to edit"),
              // instructions: z.string().describe("Single sentence instruction"),
              // blocking: z.boolean().describe("Whether to block further edits"),
            }),
            execute: async (
              {
                target_file,
                // instructions,

                // blocking
              },
              options
            ) => {
              emitAssistantMessage({
                ioServer,
                requestId: event.requestId,
                roomId,
                text: "================== EDITING FILE START=========",
              });

              let accEdit = "";
              const { textStream } = await streamText({
                model: anthropic("claude-3-7-sonnet-20250219"),
                // messages: []
                prompt: await editThreadPrompt({
                  chatHistory: [
                    {
                      content: await getCodebaseIndexPrompt(),
                      role: "system",
                    },
                    ...toChatMessages(event.previousEvents),
                    {
                      role: "user",
                      content: event.text,
                    },
                    {
                      role: "assistant",
                      content: toChatMessages(accumulatedTextDeltas)[0].content,
                    },
                  ],
                  targetFile: target_file,
                }),
              });

              for await (const text of textStream) {
                accEdit += text;
                emitAssistantMessage({
                  ioServer,
                  requestId: event.requestId,
                  roomId,
                  text: text,
                });
              }

              emitAssistantMessage({
                ioServer,
                requestId: event.requestId,
                roomId,
                text: `\n\n==================CODE EDIT: ${accEdit}======\n\n`,
              });

              console.log("EDIT FILE TOOL CALL");

              // Implementation will go here

              const result = await editFile({
                instructions: "edit file",
                codeEdit: accEdit,
                targetFile: `${target_file}`,
                onChunk: (chunk) => {
                  console.log("chunk", chunk);

                  emitAssistantMessage({
                    text: chunk,
                    ioServer,
                    requestId: event.requestId,
                    roomId,
                  });
                },
              });

              emitAssistantMessage({
                ioServer,
                requestId: event.requestId,
                roomId,
                text:
                  "\n\n\n\n========== WRITING TO FILE ================== \n\n\n" +
                  result,
              });

              await writeFile(`${target_file}`, result).catch((e) => {
                emitAssistantMessage({
                  ioServer,
                  requestId: event.requestId,
                  roomId,
                  text:
                    "================== FAILED TO WRITE TO FILE =============== " +
                    (e as Error).message,
                });
              });
              emitAssistantMessage({
                ioServer,
                requestId: event.requestId,
                roomId,
                text: "================== EDITING FILE END =============",
              });
              return {};
            },
          }),
          // file_search: tool({
          //   description:
          //     "Fast file search based on fuzzy matching against file path. Use if you know part of the file path but don't know where it's located exactly. Response will be capped to 10 results.",
          //   parameters: z.object({
          //     query: z.string().describe("Fuzzy filename to search for"),
          //     explanation: z.string().describe("One sentence explanation"),
          //   }),
          //   execute: async ({ query, explanation }, options) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),
          // delete_file: tool({
          //   description:
          //     "Deletes a file at the specified path. The operation will fail gracefully if:\n- The file doesn't exist\n- The operation is rejected for security reasons\n- The file cannot be deleted",
          //   parameters: z.object({
          //     target_file: z.string().describe("File to delete"),
          //     explanation: z.string().describe("One sentence explanation"),
          //   }),
          //   execute: async ({ target_file, explanation }, options) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),
          // reapply: tool({
          //   description:
          //     "Calls a smarter model to apply the last edit to the specified file.\nUse this tool immediately after the result of an edit_file tool call ONLY IF the diff is not what you expected.",
          //   parameters: z.object({
          //     target_file: z.string().describe("File to reapply edit to"),
          //   }),
          //   execute: async ({ target_file }, options) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),
          // parallel_apply: tool({
          //   description:
          //     "When there are multiple locations that can be edited in parallel, with a similar type of edit, use this tool to sketch out a plan for the edits.\nYou should start with the edit_plan which describes what the edits will be.\nThen, write out the files that will be edited with the edit_files argument.\nYou shouldn't edit more than 50 files at a time.",
          //   parameters: z.object({
          //     edit_plan: z.string().describe("Description of parallel edits"),
          //     edit_regions: z
          //       .array(
          //         z.object({
          //           file: z.string(),
          //           region: z.string(),
          //         })
          //       )
          //       .describe("Array of file regions to edit"),
          //   }),
          //   execute: async ({ edit_plan, edit_regions }, options) => {
          //     // Implementation will go here
          //     return {};
          //   },
          // }),
        },
      });
      for await (const obj of fullStream) {
        switch (obj.type) {
          case "tool-call-delta": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: obj.argsTextDelta,
            });
            break;
          }
          case "error": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: `Error: ${obj.error}`,
            });
            break;
          }
          case "redacted-reasoning": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: `Redacted reasoning: ${obj.data}`,
            });
            break;
          }
          case "reasoning": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: obj.textDelta,
            });
            break;
          }
          case "tool-call": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: `Tool call: ${obj.toolName}`,
            });
            break;
          }
          case "tool-result": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: `Tool result: ${JSON.stringify(obj.result)}`,
            });
            break;
          }
          case "text-delta": {
            // const serverEvent: PluginServerEvent = ;
            accumulatedTextDeltas.push({
              kind: "assistant-simple-message",
              associatedRequestId: event.requestId,
              text: obj.textDelta,
              timestamp: Date.now(),
              id: crypto.randomUUID(),
            });
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: obj.textDelta,
            });
            break;
          }
          // case "reasoning-signature": {
          //   emitAssistantMessage({
          //     ioServer,
          //     roomId,
          //     requestId: event.requestId,
          //     text: `Reasoning signature: ${obj.signature}`,
          //   });
          //   break;
          // }
          // case "source": {
          //   emitAssistantMessage({
          //     ioServer,
          //     roomId,
          //     requestId: event.requestId,
          //     text: `Source: ${obj.source}`,
          //   });
          //   break;
          // }
          case "finish": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: "Finished reason:" + obj.finishReason,
            });
            break;
          }
          case "tool-call-streaming-start": {
            emitAssistantMessage({
              ioServer,
              roomId,
              requestId: event.requestId,
              text: `Starting tool call: ${obj.toolName}`,
            });
            break;
          }
          // case "step-start": {
          //   emitAssistantMessage({
          //     ioServer,
          //     roomId,
          //     requestId: event.requestId,
          //     text: `Step started: ${obj.request.body}`,
          //   });
          //   break;
          // }
          // case "step-finish": {
          //   emitAssistantMessage({
          //     ioServer,
          //     roomId,
          //     requestId: event.requestId,
          //     text: `Step finished: ${obj.finishReason}`,
          //   });
          //   break;
          // }
        }

        // console.log(textPart);
      }
    });
  });
};

const emitAssistantMessage = ({
  ioServer,
  roomId,
  requestId,
  text,
}: {
  ioServer: Server;
  roomId: string;
  requestId: string;
  text: string;
}) => {
  ioServer.to(roomId).emit("message", {
    kind: "assistant-simple-message",
    associatedRequestId: requestId,
    text,
    timestamp: Date.now(),
    id: crypto.randomUUID(),
  } satisfies PluginServerEvent);
};
