"use client";
import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useLayoutEffect,
} from "react";
import { useChatStore } from "../chat-store";
import { nanoid } from "nanoid";
import {
  SendIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare,
  PanelRightOpen,
  RefreshCw,
  Video,
  Camera,
  PenTool,
  Inspect,
  Clock,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ChatMessage, toGroupedChatMessages } from "zenbu-plugin/src/ws/utils";
import { Header } from "./header";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";
import TokenStreamingWrapper from "./wrapper";
import { ThinkingUITester } from "./thinking";
import { Socket } from "socket.io-client";
import { flushSync } from "react-dom";
import { ChatTextArea } from "./context-input";
import { useEventWS } from "src/app/ws";
import { iife, cn } from "src/lib/utils";
import {
  ClientMessageEvent,
  ClientTaskEvent,
} from "zenbu-plugin/src/ws/schemas";

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
  const [hiddenThreads, setHiddenThreads] = useState<Set<number>>(new Set());

  const { socket } = useEventWS({
    onMessage: (message) => {
      const { event, projectChatId } = message;
      const todo_validationOverProjectIdAndClosureVariables = () => undefined;
      todo_validationOverProjectIdAndClosureVariables();
      // console.log("got back message", message);

      // wut was i doing
      // if (event.kind === "user-message") {
      //   throw new Error("Invariant: user message cannot come from server");
      // }

      if (
        event.text.includes("================== EDITING FILE END =============")
      ) {
        const iframe = document.getElementById(
          "child-iframe",
        ) as HTMLIFrameElement | null;

        if (!iframe) {
          throw new Error("invariant: must have child-iframe as preview");
        }
        iframe.src = iframe.src;
      }

      eventLog.actions.pushEvent(event);
    },
  });

  const [mainThreadMessages, setMainThreadMessages] = useState<
    Array<ChatMessage>
  >([]);

  const [otherThreadMessages, setOtherThreadMessages] = useState<
    Array<Array<ChatMessage>>
  >([]);

  // i need a post mortem here
  // it would resolve the data only after a tick? It would return a promise? Why wouldn't the type show that though?
  // omg its cause it would push it async, so then i wouldn't have the data every render no matter what, every time it regenerated it would have it one tick too late
  useEffect(() => {
    iife(async () => {
      // this should resolve as a microtask since its just a promise, so it should be complete before rendering, but unfortunately react will not flush it in time, whatever we pay a tick this is a dog shit abstraction i just need a sync vs async i don't know if there's a way around this aifjasdkl;fjhdsaklfjdas;lkjfdsa;kljfkl;adskjfj;dlaksfjk
      // i will need to fix this i just will not rn
      const { mainThreadMessages, otherThreadsMessages } =
        await toGroupedChatMessages(eventLog.events, true);

      setMainThreadMessages(mainThreadMessages);
      setOtherThreadMessages(otherThreadsMessages);
    });
    // });
  }, [eventLog.events]);
  // const { mainThreadMessages, otherThreadsMessages } =
  //

  // const mainThreadMessages = Object.freeze([...mainThreadMessages_]);

  // console.log("chat messages", mainThreadMessages.slice());

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isScrolledToBottom =
      Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) <
      1;
    setIsAtBottom(isScrolledToBottom);
  };

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [mainThreadMessages, isAtBottom]);

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

    const clientEvent: ClientMessageEvent = {
      requestId: nanoid(),
      context: [],
      kind: "user-message",
      text: chatControls.state.input,
      timestamp: Date.now(),
      id: nanoid(),
      previousEvents: eventLog.events,
    };

    eventLog.actions.pushEvent(clientEvent);

    console.log("sending", chatControls.state.input);
    chatControls.actions.setInput("");

    socket.emit("message", clientEvent);
    updateInputSize();
  };

  const scheduleTask = () => {
    if (!chatControls.state.input.trim() || !socket) return;

    const clientEvent: ClientTaskEvent = {
      requestId: nanoid(),
      context: [],
      kind: "user-task",
      text: chatControls.state.input,
      timestamp: Date.now(),
      id: nanoid(),
      previousEvents: eventLog.events,
    };

    eventLog.actions.pushEvent(clientEvent);

    chatControls.actions.setInput("");

    socket.emit("message", clientEvent);

    updateInputSize();
  };

  if (!socket) {
    // needs loading, but realistically it should connect instant since local
    return null;
  }

  const isLastMessageFromUser =
    mainThreadMessages.length > 0 &&
    mainThreadMessages[mainThreadMessages.length - 1].role === "user";

  return (
    <WSContext.Provider
      value={{
        socket,
      }}
    >
      <div className="flex h-full flex-col relative overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
        </div>

        <Header onCloseChat={onCloseChat} />

        <ScrollArea
          className="flex-1 px-4 py-3 relative z-10 w-full overflow-x-hidden"
          onScroll={handleScroll}
        >
          <div className="space-y-4 pt-3 pb-2 w-full">
            {/* {`bro what len: ${mainThreadMessages.length}`} */}

            {mainThreadMessages.map((message, index) => (
              <div key={index}>
                {iife(() => {
                  console.log(
                    "whats the roke",
                    message.role,
                    index,
                    mainThreadMessages,
                    mainThreadMessages.length,
                    // otherThreadsMessages,
                    eventLog,
                  );

                  switch (message.role) {
                    case "assistant": {
                      return (
                        <AssistantMessage
                          message={message satisfies ChatMessage}
                        />
                      );
                    }
                    case "user": {
                      return <UserMessage message={message} />;
                    }
                  }
                })}
              </div>
            ))}

            {isLastMessageFromUser && (
              <div className="flex items-center space-x-2 pl-4">
                <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse"></div>
                <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-150"></div>
                <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-300"></div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          {/* <ThinkingUITester/> */}
        </ScrollArea>

        {/* {otherThreadsMessages.length > 0 && (
          <div className="px-4 py-2 relative z-10 w-full">
            {otherThreadsMessages.map(
              (thread, index) =>
                !hiddenThreads.has(index) && (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="rounded-xl backdrop-blur-xl bg-[rgba(24,24,26,0.6)] border border-[rgba(255,255,255,0.05)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-hidden">
                      <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3 text-[#A1A1A6]" />
                            <span className="text-[10px] font-light text-[#A1A1A6]">
                              Thread {index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setHiddenThreads((prev) => {
                                const next = new Set(prev);
                                next.add(index);
                                return next;
                              })
                            }
                            className="text-[#A1A1A6] hover:text-white transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="px-3 py-2 max-h-[120px] overflow-y-auto">
                        {thread.map((message, msgIndex) => (
                          <div
                            key={msgIndex}
                            className="text-[11px] text-[#A1A1A6] font-light"
                          >
                            {typeof message.content === "string"
                              ? message.content
                              : "not text"}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
            )}
          </div>
        )} */}

        <div className="px-4 pb-4 relative z-10 w-full">
          <div className="rounded-lg backdrop-blur-xl bg-accent/5 border border-border/40 shadow-lg overflow-hidden w-full transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col text-xs">
              <div className="relative min-h-[50px] w-full bg-background/5">
                <ChatTextArea />
              </div>

              <div className="flex items-center justify-end px-4 py-2 border-t border-border/40 bg-accent/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={scheduleTask}
                    disabled={!chatControls.state.input.trim()}
                    className={cn(
                      "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light",
                      "bg-accent/10 border border-border/40 hover:bg-accent/20 text-foreground",
                      "transition-all duration-300",
                      !chatControls.state.input.trim() &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <Clock className="h-3 w-3 mr-1.5" />
                    <span>Task</span>
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!chatControls.state.input.trim()}
                    className={cn(
                      "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light",
                      "bg-accent/10 border border-border/40 hover:bg-accent/20 text-foreground",
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
          </div>
        </div>
      </div>
    </WSContext.Provider>
  );
}
