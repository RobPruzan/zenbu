"use client";
import { ClientEvent, PartialEvent } from "zenbu-redis";
import { useState, useRef, useEffect, createContext, useContext } from "react";
import { useChatStore } from "../chat-store";
import { nanoid } from "nanoid";
import { SendIcon, Clock, ArrowRightLeft } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
// import { ChatMessage } from "zenbu-plugin/src/ws/utils";
import { CoreMessage } from "ai";
import { Header } from "./header";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";
import { Socket } from "socket.io-client";
import { ChatTextArea } from "./context-input";
import { useWS } from "src/app/ws";
import { iife, cn } from "src/lib/utils";
// import { ClientTaskEvent } from "zenbu-plugin/src/ws/schemas";
import { trpc } from "src/lib/trpc";
import { client_eventToMessages } from "zenbu-plugin/src/v2/client-utils";
import { Effect } from "effect";
import { TRANSITION_MESSAGE } from "zenbu-plugin/src/v2/shared-utils";
import { useIFrameMessenger } from "src/hooks/use-iframe-listener";
import { useMakeRequest } from "../devtools-overlay";
import { AnimatePresence, motion } from "framer-motion";

export const WSContext = createContext<{
  socket: Socket<any, any>;
}>(null!);

export const useWSContext = () => useContext(WSContext);

export function Chat({ onCloseChat }: { onCloseChat: () => void }) {
  const { eventLog, inspector, chatControls, context, toolbar } =
    useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(
    null,
  ) as React.MutableRefObject<HTMLTextAreaElement>;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const project = useChatStore((state) => state.iframe.state.project);
  const [rawEvents] = trpc.project.getEvents.useSuspenseQuery({
    projectName: project.name,
  });
  console.log("fetching on", project.name);

  // console.log("chunks", events);
  const devtoolsRequest = useMakeRequest();

  const utils = trpc.useUtils();

  const derivedMessages = Effect.runSync(client_eventToMessages(rawEvents));
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(5);

  const flushQueue = useRef<Array<PartialEvent>>([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      utils.project.getEvents.setData({ projectName: project.name }, (prev) =>
        prev ? [...prev, ...flushQueue.current] : flushQueue.current,
      );
      flushQueue.current = [];
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [project.name]);

  const { socket } = useWS({
    projectName: project.name,
    onMessage: async (message) => {
      const { event, projectName } = message;
      const todo_validationOverProjectIdAndClosureVariables = () => undefined;
      todo_validationOverProjectIdAndClosureVariables();

      if (
        event.kind === "user-message" &&
        event.text.includes(TRANSITION_MESSAGE)
      ) {
        const iframe = document.getElementById(
          "child-iframe",
        ) as HTMLIFrameElement | null;

        // const res = await devtoolsRequest({
        //   kind: "start-recording",
        //   id: nanoid(),
        //   responsePossible: true,
        // });

        if (!iframe) {
          throw new Error("invariant: must have child-iframe as preview");
        }
        iframe.src = iframe.src;
      }
      flushQueue.current.push(event);
    },
  });

  const [mainThreadMessages, setMainThreadMessages] = useState<Array<any>>([]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isScrolledToBottom =
      Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) <
      1;
    setIsAtBottom(isScrolledToBottom);
  };

  useEffect(() => {
    if (isAtBottom && scrollAreaRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [derivedMessages, isAtBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      const parent = textareaRef.current.parentElement;
      if (parent) {
        parent.style.height = "52px";
        const scrollHeight = textareaRef.current.scrollHeight;
        parent.style.height = `${Math.min(scrollHeight, 100)}px`;
      }
    }
  }, [chatControls.state.input]);

  const updateInputSize = () => {
    if (!textareaRef.current || !textareaRef.current.parentElement) {
      return;
    }
    textareaRef.current.parentElement.style.height = "52px";
  };

  const sendMessage = () => {
    if (!chatControls.state.input.trim() || !socket) return;

    const clientEvent: ClientEvent = {
      requestId: nanoid(),
      context: [],
      kind: "user-message",
      text: chatControls.state.input,
      timestamp: Date.now(),
      id: nanoid(),
    };
    eventLog.actions.pushEvent(clientEvent);
    console.log("sending", chatControls.state.input);
    chatControls.actions.setInput("");
    console.log("sending at", project.name);

    socket.emit("message", { event: clientEvent, projectName: project.name });
    updateInputSize();
  };

  if (!socket) {
    return null;
  }

  const isLastMessageFromUser =
    mainThreadMessages.length > 0 &&
    mainThreadMessages[mainThreadMessages.length - 1].role === "user";

  const visibleDerivedMessages = derivedMessages.slice(-visibleMessagesCount);
  // rewrite this idek what it does
  const findRawEvent = (derivedMsg: {
    content: any[];
    role: "user" | "assistant";
  }) => {
    if (derivedMsg.role === "user" && typeof derivedMsg.content === "object") {
      const textPart = derivedMsg.content.find((part) => part.type === "text");
      if (textPart) {
        return rawEvents.find(
          (e) => e.kind === "user-message" && e.text === textPart.text,
        );
      }
    }
    return undefined;
  };

  return (
    <WSContext.Provider
      value={{
        socket,
      }}
    >
      <div className="flex h-full flex-col relative overflow-hidden ">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#070808] to-[#090909]" />
        </div>

        <Header onCloseChat={onCloseChat} />

        <div
          className="flex-1 px-4 py-3 relative z-10 w-full overflow-y-auto"
          onScroll={handleScroll}
          ref={scrollAreaRef}
        >
          <AnimatePresence mode="wait">
            <div className="space-y-4 pt-3 pb-2 w-full">
              {derivedMessages.length > visibleMessagesCount && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center mb-4"
                >
                  <button
                    onClick={() => setVisibleMessagesCount((prev) => prev + 5)}
                    className="px-3 py-1 rounded-md text-xs font-light bg-accent/10 border border-border/50 hover:bg-accent/20 text-foreground transition-colors duration-200"
                  >
                    Show More
                  </button>
                </motion.div>
              )}

              {visibleDerivedMessages.map((message, index) => {
                const rawEvent = findRawEvent(message);
                const isTransition =
                  rawEvent?.kind === "user-message" &&
                  rawEvent.meta === "tool-transition";

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-full"
                  >
                    <div className="overflow-hidden break-words whitespace-normal">
                      {iife(() => {
                        switch (message.role) {
                          case "assistant": {
                            return <AssistantMessage message={message} />;
                          }
                          case "user": {
                            if (isTransition) {
                              const textContent = Array.isArray(message.content)
                                ? message.content.find((p) => p.type === "text")
                                    ?.text || ""
                                : "";
                              return (
                                <div className="my-2 p-3 rounded-lg border border-dashed border-purple-500/50 bg-purple-900/10 text-purple-300/80 text-xs italic shadow-sm flex items-center gap-2">
                                  <ArrowRightLeft className="h-4 w-4 flex-shrink-0" />
                                  <span>{textContent}</span>
                                </div>
                              );
                            } else {
                              return <UserMessage message={message} />;
                            }
                          }
                        }
                      })}
                    </div>
                  </motion.div>
                );
              })}

              {isLastMessageFromUser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2 pl-4"
                >
                  <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse"></div>
                  <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-150"></div>
                  <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-300"></div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </AnimatePresence>
        </div>

        <div className="px-4 pb-4 relative z-10 w-full">
          <motion.div
            // initial={{ opacity: 0, y: 20 }}
            // animate={{ opacity: 1, y: 0 }}
            // transition={{ duration: 0.4 }}
            className="rounded-lg backdrop-blur-xl bg-accent/5 border shadow-lg overflow-hidden w-full transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex flex-col text-xs">
              <div className="relative min-h-[50px] w-full bg-background/5">
                <ChatTextArea />
              </div>

              <div className="flex items-center justify-end px-4 py-2 border-t bg-accent/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={sendMessage}
                    disabled={!chatControls.state.input.trim()}
                    className={cn(
                      "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light",
                      "bg-accent/10 border hover:bg-accent/20 text-foreground",
                      "transition-all duration-300",
                      !chatControls.state.input.trim() &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span>Send</span>
                    <SendIcon className="ml-1.5 h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </WSContext.Provider>
  );
}
