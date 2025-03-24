"use client";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "./chat-instance-context";
import { iife } from "~/lib/utils";
import { useEventWS } from "~/app/ws";
import { ClientEvent } from "zenbu-plugin/src/ws/ws";
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
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ChatMessage, toChatMessages } from "zenbu-plugin/src/ws/utils";

const UserMessage = ({ message }: { message: ChatMessage }) => {
  return (
    <div className="group mb-6 max-w-full">
      <div className="rounded-2xl bg-[#121214] backdrop-blur-xl border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.15)] overflow-hidden max-w-full transform hover:translate-y-[-1px] transition-all duration-300">
        <div className="border-b border-[rgba(255,255,255,0.04)] px-4 py-2 flex items-center overflow-hidden bg-[#1a1a1c]">
          <FileText className="h-3 w-3 mr-2 flex-shrink-0 text-[#A1A1A6]" />
          <span className="text-[11px] text-[#F2F2F7] font-light truncate">
            Context
          </span>
        </div>

        <div className="px-4 py-3 text-xs text-[#F2F2F7] whitespace-pre-wrap font-sans leading-relaxed break-words overflow-auto">
          {message.content}
        </div>

        <div className="flex items-center justify-between text-[10px] px-4 py-2 text-[#A1A1A6] bg-[#1a1a1c]">
          <div className="flex items-center">
            <ChevronDown className="h-2.5 w-2.5 mr-1.5" />
            <span className="font-light">gpt-4o</span>
          </div>
          <div className="flex items-center">
            <button className="hover:text-white transition-colors">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-2.5 w-2.5" />
                Restore
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssistantMessage = ({ message }: { message: ChatMessage }) => {
  return (
    <div className="group mb-6 max-w-full pl-2">
      <div className="text-xs text-[#F2F2F7] whitespace-pre-wrap font-light leading-relaxed px-3 py-2 break-words overflow-auto rounded-2xl bg-[#15151a] backdrop-blur-xl border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
        <div className="overflow-hidden">{message.content}</div>
      </div>
    </div>
  );
};

const SystemPrompt = () => {
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const systemPromptContent =
    "You are a powerful agentic AI coding assistant, powered by Claude 3.7 Sonnet. You operate exclusively in Cursor, the world's best IDE. You are pair programming with a USER to solve their coding task. The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question. Focus on building a modern website with a clean dark interface similar to Vercel's design aesthetic.";

  return (
    <div className="mb-4 w-full">
      <div
        className={`group cursor-pointer rounded-2xl backdrop-blur-xl w-full transition-all duration-300 ${showSystemPrompt ? "bg-[#121214] border border-[rgba(255,255,255,0.05)] shadow-[0_4px_24px_rgba(0,0,0,0.12)]" : "bg-[#121214] border border-[rgba(255,255,255,0.03)] hover:bg-[#1a1a1c] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"}`}
        onClick={() => setShowSystemPrompt(!showSystemPrompt)}
      >
        <div className="flex items-center px-4 py-2.5 gap-2">
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            <FileText className="h-3 w-3 text-[#A1A1A6]" />
          </div>
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-[11px] font-light text-[#F2F2F7]">
              System Prompt
            </span>
            <div className="flex items-center text-[#A1A1A6]">
              {showSystemPrompt ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </div>
          </div>
        </div>

        {showSystemPrompt && (
          <div className="px-10 pb-4 pt-1 text-[11px] text-[#A1A1A6] leading-relaxed border-t border-[rgba(255,255,255,0.03)] font-light">
            {systemPromptContent}
          </div>
        )}
      </div>
    </div>
  );
};

const Header = ({ onCloseChat }: { onCloseChat: () => void }) => {
  return (
    <div className="relative z-10 backdrop-blur-xl bg-[rgba(24,24,26,0.6)] border-b border-[rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between h-12 px-3">
        <div className="flex-1"></div>
        <div className="flex items-center bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] rounded-full h-7 w-[280px] px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></div>
          <span className="font-light text-[11px] text-[#F2F2F7]">
            localhost:4200
          </span>
          <div className="flex-1"></div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#A1A1A6] hover:text-white rounded-full bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(40,40,46,0.7)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#A1A1A6] hover:text-white rounded-full bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(40,40,46,0.7)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => {
              onCloseChat();
            }}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#A1A1A6] hover:text-white rounded-full bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(40,40,46,0.7)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Chat = ({ onCloseChat }: { onCloseChat: () => void }) => {
  const { eventLog, inspector, chatControls } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { socket } = useEventWS({
    onMessage: (message) => {
      // console.log("got back message", message);

      if (message.kind === "user-message") {
        throw new Error("Invariant: user message cannot come from server");
      }

      if (
        message.text.includes(
          "================== EDITING FILE END =============",
        )
      ) {
        const iframe = document.getElementById(
          "child-iframe",
        ) as HTMLIFrameElement | null;

        if (!iframe) {
          throw new Error("invairant: must have child-iframe as preview");
        }
        iframe.src = iframe.src;
      }

      eventLog.actions.pushEvent(message);
    },
  });

  const messages = toChatMessages(eventLog.events);

  // Add scroll handler to detect when user scrolls
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
  }, [messages, isAtBottom]);

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

  const handleSendMessage = () => {
    if (!chatControls.state.input.trim() || !socket) return;

    const clientEvent: ClientEvent = {
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

    if (textareaRef.current && textareaRef.current.parentElement) {
      textareaRef.current.parentElement.style.height = "52px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Darker solid background */}
        <div className="absolute inset-0 bg-[#080809]"></div>
        
        {/* Glass blur effect layer with distortion */}
        <div className="absolute inset-0 backdrop-filter backdrop-blur-lg"></div>
      </div>

      <Header onCloseChat={onCloseChat} />

      <ScrollArea
        className="flex-1 px-4 py-3 relative z-10 w-full overflow-x-hidden"
        onScroll={handleScroll}
      >
        <div className="space-y-4 pt-3 pb-2 w-full">
          <SystemPrompt />

          {messages.map((message, index) => (
            <div key={index}>
              {iife(() => {
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
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="px-4 pb-4 relative z-10 w-full">
        <div className="rounded-2xl backdrop-blur-xl bg-[rgba(24,24,26,0.6)] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden w-full transition-all duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
          <div className="flex items-center px-2 py-1.5 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)]">
            <div className="flex-1 flex items-center gap-2 justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2.5 py-1 rounded-full flex items-center transition-all duration-300 ${
                        inspector.state.kind === "inspecting"
                          ? "text-white bg-[rgba(50,50,56,0.7)] border border-[rgba(255,255,255,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
                          : "text-[#A1A1A6] hover:text-white hover:bg-[rgba(40,40,46,0.7)] border border-[rgba(255,255,255,0.05)]"
                      }`}
                      onClick={() => {
                        inspector.actions.setInspectorState({
                          kind:
                            inspector.state.kind === "inspecting"
                              ? "off"
                              : "inspecting",
                        });
                      }}
                    >
                      <Inspect className="h-3 w-3 mr-1" />
                      <span className="text-[10px] font-light">Select</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1.5 px-3 bg-[rgba(24,24,26,0.9)] backdrop-blur-2xl text-white border-[rgba(255,255,255,0.05)] rounded-full font-light shadow-sm"
                  >
                    Inspect element
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 py-1 rounded-full flex items-center text-[#A1A1A6] hover:text-white hover:bg-[rgba(40,40,46,0.7)] border border-[rgba(255,255,255,0.05)] transition-all duration-300"
                    >
                      <Video className="h-3 w-3 mr-1" />
                      <span className="text-[10px] font-light">Record</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1.5 px-3 bg-[rgba(24,24,26,0.9)] backdrop-blur-2xl text-white border-[rgba(255,255,255,0.05)] rounded-full font-light shadow-sm"
                  >
                    Record interactions
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 py-1 rounded-full flex items-center text-[#A1A1A6] hover:text-white hover:bg-[rgba(40,40,46,0.7)] border border-[rgba(255,255,255,0.05)] transition-all duration-300"
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      <span className="text-[10px] font-light">Screenshot</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1.5 px-3 bg-[rgba(24,24,26,0.9)] backdrop-blur-2xl text-white border-[rgba(255,255,255,0.05)] rounded-full font-light shadow-sm"
                  >
                    Take screenshot
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 py-1 rounded-full flex items-center text-[#A1A1A6] hover:text-white hover:bg-[rgba(40,40,46,0.7)] border border-[rgba(255,255,255,0.05)] transition-all duration-300"
                    >
                      <PenTool className="h-3 w-3 mr-1" />
                      <span className="text-[10px] font-light">Draw</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1.5 px-3 bg-[rgba(24,24,26,0.9)] backdrop-blur-2xl text-white border-[rgba(255,255,255,0.05)] rounded-full font-light shadow-sm"
                  >
                    Draw on page
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex flex-col text-xs">
            <div className="relative min-h-[50px] w-full bg-[rgba(20,20,22,0.4)] backdrop-filter backdrop-blur-md">
              <textarea
                ref={textareaRef}
                value={chatControls.state.input}
                onChange={(e) => chatControls.actions.setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="absolute top-0 left-0 w-full h-full pt-3.5 pl-4 pr-4 pb-1.5 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-xs text-[#F2F2F7] placeholder:text-[rgba(161,161,166,0.8)] overflow-auto leading-relaxed font-light"
                style={{
                  minHeight: "50px",
                  maxHeight: "100px",
                }}
              />
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)]">
              <div className="text-[10px] text-[#A1A1A6] flex items-center gap-1.5 font-light">
                <span>claude-3.7-sonnet</span>
                <ChevronDown className="h-3 w-3" />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!chatControls.state.input.trim()}
                className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light backdrop-blur-xl bg-[rgba(40,40,46,0.8)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(48,48,54,0.85)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.25)] text-white transition-all duration-300 ${!chatControls.state.input.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>Send</span>
                <SendIcon className="ml-1.5 h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
