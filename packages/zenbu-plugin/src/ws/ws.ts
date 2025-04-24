// import { FilePart, ImagePart, UserContent } from "ai";
// import type { Server as HttpServer } from "node:http";
// import { Server } from "socket.io";
// import { z } from "zod";
// import { removeComments } from "../create-server.js";
// import { indexCodebase } from "../tools/code-base-search.js";
// import { readFile } from "node:fs/promises";
// import {
//   activeStreams,
//   iife,
//   parallelizeTask,
//   sendActiveMainThreadMessage,
//   sendIdleMainThreadMessage,
// } from "../tools/message-runtime.js";
// import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
// import { trpc } from "./trpc.js";
// import { ChatMessage, toChatMessages } from "./utils.js";
// import {
//   EventLogEvent,
//   ClientMessageEvent,
//   ClientTaskEvent,
//   PluginServerEvent,
// } from "./schemas.js";
// /**
//  *
//  *
//  * plan, we are a websocket that people can connect to, and write to a database (batch and flush)
//  *
//  *
//  * the client will connect to the websocket
//  *
//  * we will use react query initial data without refetching, then optimistic update the cache with the updates
//  *
//  *
//  * we could model it as an event log? might make undo and debuggability nice?
//  *
//  *
//  * yeah nice we can point the sqlite db either at remote or local that's nice
//  *
//  *
//  */
// // export type EventLogEvent =
// //   | ClientMessageEvent
// //   | PluginServerEvent
// //   | ClientTaskEvent;

// // export const eventLogEventSchema = z.union();

// export const HARD_CODED_USER_PROJECT_PATH =
//   "/Users/robby/zenbu/packages/examples/iframe-website";

// const pendingEvents: Array<EventLogEvent> = [];

// const startFlushInterval = () => {};

// // i probably shouldn't couple events gr

// // i will need to couple in event log, but i shouldn't couple the types themselves

// const CODEBASE_INDEX_PROMPT_PATH =
//   "/Users/robby/zenbu/packages/zenbu-plugin/src/codebase-index.md";
// let codebaseIndexPromptCache: string | null = null;

// export const getCodebaseIndexPrompt = async () => {
//   if (codebaseIndexPromptCache) {
//     return codebaseIndexPromptCache;
//   }

//   const prompt = await readFile(
//     "/Users/robby/zenbu/packages/zenbu-plugin/src/codebase-index.md",
//     "utf-8"
//   );

//   const templated = prompt.replace("{codebaseString}", await indexCodebase());
//   codebaseIndexPromptCache = templated;

//   return templated;
// };

// export const editThreadPrompt = async ({
//   targetFile,
//   chatHistory,
// }: {
//   targetFile: string;
//   chatHistory: Array<ChatMessage>;
// }) => {
//   const systemPrompt = await readFile(
//     "/Users/robby/zenbu/packages/zenbu-plugin/src/thread-prompt.md",
//     "utf-8"
//   ).then((value) => removeComments(value));

//   const templated = systemPrompt
//     .replace("{targetFile}", targetFile)
//     .replace("{existingChatHistory}", JSON.stringify(chatHistory));

//   return templated;
// };

// export const injectWebSocket = (server: HttpServer) => {
//   const ioServer = new Server(server, {
//     path: "/ws",
//     serveClient: false,
//     cors: {
//       origin: "*", // narrow later
//       methods: ["GET", "POST"],
//     },
//     transports: ["websocket"],
//   });

//   ioServer.use(async (socket, next) => {
//     next();
//   });

//   ioServer.on("connection", async (socket) => {
//     const roomId = socket.handshake.query.roomId as string;
//     console.log("did we get a room id?", roomId);

//     if (!roomId) {
//       throw new Error("Invariant: roomId is required for socket connection");
//     }

//     socket.join(roomId);
//     console.log(`Socket ${socket.id} joined room ${roomId}`);

//     socket.on(
//       "message",
//       // er do i want the project id on the event? Nah probably not it should be sent with the event
//       // i mean uh
//       // will be easy to wrap because of the api boundaries
//       // for the server event i guess we should wrap it too sending the project id back for validation + consistency
//       async ({
//         event,
//         projectId,
//       }: {
//         event: ClientMessageEvent | ClientTaskEvent;
//         projectId: string;
//       }) => {
//         // should confirm ordering, but almost certainly never gonna lose the race
//         trpc.project.persistEvent.mutate({
//           event,
//           projectId,
//         });
//         const emitEvent = (text: string, threadId?: string) => {
//           const assistantEventArg: Parameters<typeof emitAssistantMessage>[0] =
//             {
//               ioServer,
//               requestId: event.requestId,
//               roomId,
//               text,
//               threadId: threadId ?? null,
//               projectId,
//             };
//           trpc.project.persistEvent.mutate({
//             event: makeAssistantEvent(assistantEventArg),
//             // project chat
//             projectId,
//           });
//           emitAssistantMessage(assistantEventArg);
//         };
//         switch (event.kind) {
//           case "user-message": {
//             /**
//              * to implement interruption ill need to have the full in sync messages
//              * the model was generating with
//              */

//             // const plannerResult = await planner({
//             //   codebase: await getCodebaseIndexPrompt(),
//             //   emitEvent,
//             //   message: event.text,
//             //   previousMessages: toChatMessages(event.previousEvents),
//             // });

//             // emitEvent(
//             //   "GEMINI PLAN:" + JSON.stringify(plannerResult.plan, null, 2)
//             // );
//             const messageCase = iife(() => {
//               const mainThreadStream = activeStreams.current.find(
//                 ({ kind }) => kind === "main-thread"
//               );
//               if (mainThreadStream) {
//                 return { kind: "thread-active", mainThreadStream };
//               }
//               return { kind: "thread-idle" };
//             });

//             switch (messageCase.kind) {
//               case "thread-active": {
//                 emitEvent("aborting");
//                 messageCase.mainThreadStream?.abort();
//                 activeStreams.current = activeStreams.current.filter(
//                   (obj) => obj !== messageCase.mainThreadStream
//                 );

//                 try {
//                   await sendActiveMainThreadMessage({
//                     emitEvent,
//                     message: event.text,
//                     previousChatMessages: await toChatMessages(
//                       event.previousEvents,
//                       true,
//                       imageToBytes,
//                       videoToBytes
//                     ),
//                     requestId: event.requestId,
//                   });
//                 } catch {
//                   /**
//                    *
//                    */
//                 }

//                 return;
//               }
//               case "thread-idle": {
//                 // try {
//                 // emitEvent("🔥");

//                 // yippy we can just send da file
//                 //   interface FilePart {
//                 //     type: 'file';
//                 //     /**
//                 //   File data. Can either be:

//                 //   - data: a base64-encoded string, a Uint8Array, an ArrayBuffer, or a Buffer
//                 //   - URL: a URL that points to the image
//                 //      */
//                 //     data: DataContent | URL;
//                 //     /**
//                 //   Optional filename of the file.
//                 //      */
//                 //     filename?: string;
//                 //     /**
//                 //   Mime type of the file.
//                 //      */
//                 //     mimeType: string;
//                 //     /**
//                 //   Additional provider-specific metadata. They are passed through
//                 //   to the provider from the AI SDK and enable provider-specific
//                 //   functionality that can be fully encapsulated in the provider.
//                 //    */
//                 //     providerOptions?: ProviderOptions;
//                 //     /**
//                 //   @deprecated Use `providerOptions` instead.
//                 //    */
//                 //     experimental_providerMetadata?: ProviderMetadata;
//                 // }
//                 const messages = await toChatMessages(
//                   event.previousEvents,
//                   true,
//                   imageToBytes,
//                   videoToBytes
//                 );
//                 console.log("the chat messages", messages);

//                 const content: UserContent = await Promise.all([
//                   ...event.context.map(async (c) => {
//                     switch (c.kind) {
//                       case "image": {
//                         const userContent: ImagePart = {
//                           type: "image",
//                           image: await imageToBytes(c.filePath),
//                         };
//                         return userContent;
//                       }
//                       case "video": {
//                         const { data, mimeType } = await videoToBytes(
//                           c.filePath
//                         );
//                         const userContent: FilePart = {
//                           // type: "image",
//                           type: "file",
//                           data,
//                           mimeType,

//                           // image: await imageToBytes(c.filePath),
//                         };
//                         return userContent;
//                       }
//                     }
//                   }),
//                 ]);

//                 // todo: this is broken if the user doesn't send a message
//                 // would be nice if we had auto prompt that say just "the user sent an image with no text, infer meaning from that image, it might be referencing that the agent should do something, likely contextual"
//                 content.push({
//                   type: "text",
//                   text: event.text,
//                 });
//                 try {
//                   await sendIdleMainThreadMessage({
//                     emitEvent,
//                     message: {
//                       role: "user",
//                       // gonna regret this
//                       content: content,
//                     },
//                     previousChatMessages: messages,
//                     requestId: event.requestId,
//                   });
//                 } catch {
//                   /**
//                    *
//                    */
//                 }
//                 // }
//                 return;
//               }
//             }

//             return;
//           }
//           case "user-task": {
//             parallelizeTask({
//               chatMessages: await toChatMessages(
//                 event.previousEvents,
//                 true,
//                 imageToBytes,
//                 videoToBytes
//               ), // im actually not sure if I want the thread to see the models temporary work... i probably do
//               emitEvent,
//               message: event.text,
//             }).catch(() => {
//               /**
//                *
//                */
//             });

//             /**
//              *
//              */

//             return;
//           }
//         }
//       }
//     );
//   });
// };

// const makeAssistantEvent = (
//   arg: Parameters<typeof emitAssistantMessage>[0]
// ): PluginServerEvent => ({
//   kind: "assistant-simple-message",
//   associatedRequestId: arg.requestId,
//   text: arg.text,
//   timestamp: Date.now(),
//   id: crypto.randomUUID(),
//   threadId: arg.threadId,
// });
// const emitAssistantMessage = (arg: {
//   ioServer: Server;
//   roomId: string;
//   requestId: string;
//   text: string;
//   threadId: null | string;
//   projectId: string;
// }) => {
//   arg.ioServer.to(arg.roomId).emit("message", {
//     projectId: arg.requestId,
//     event: makeAssistantEvent(arg),
//   });
// };

// export const imageToBytes = async (path: string) => {
//   return await readFile(`.zenbu/screenshots/${path}`);
// };

// const videoCache = new Map<string, { data: string; mimeType: string }>();

// export const videoToBytes = async (path: string) => {
//   const existing = videoCache.get(path);
//   if (existing) {
//     return existing;
//   }
//   // return await readFile(`.zenbu/video/${path}`);

//   const fileManager = new GoogleAIFileManager(
//     process.env.GOOGLE_GENERATIVE_AI_API_KEY!
//   );

//   const filePath = `.zenbu/video/${path}`;
//   let geminiFile = await fileManager.uploadFile(filePath, {
//     name: `ai-${Math.random().toString(36).substring(7)}`,
//     mimeType: "video/webm",
//   });

//   while (true) {
//     if (geminiFile.file.state !== FileState.ACTIVE) {
//       console.log("File state:", geminiFile.file.state);

//       geminiFile = { file: await fileManager.getFile(geminiFile.file.name) };
//       await new Promise((res) => {
//         setTimeout(() => {
//           res(null);
//         }, 1000);
//       });
//       continue;
//     }
//     break;
//   }
//   console.log("our gemini file", geminiFile);
//   const data = {
//     data: geminiFile.file.uri,
//     mimeType: geminiFile.file.mimeType,
//   };
//   videoCache.set(path, data);
//   return data;
// };
