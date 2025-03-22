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
    <div className="group mb-4 max-w-full">
      <div className="rounded-md bg-[#1e1e1e] border border-[#333333] overflow-hidden max-w-full">
        <div className="border-b border-[#333333] px-3 py-1 flex items-center overflow-hidden">
          <FileText className="h-3 w-3 mr-1.5 flex-shrink-0 text-[#a0a0a5]" />
          <span className="text-[10px] text-[#e0e0e3] font-medium truncate">
            Context
          </span>
        </div>

        <div className="px-3 py-2 text-xs text-[#e0e0e3] whitespace-pre-wrap font-sans leading-relaxed break-words overflow-auto">
          {message.content}
        </div>

        <div className="flex items-center justify-between text-[9px] px-3 py-1 text-[#6e6e76]">
          <div className="flex items-center">
            <ChevronDown className="h-2.5 w-2.5 mr-1" />
            <span>gpt-4o</span>
          </div>
          <div className="flex items-center">
            <button className="hover:text-[#a0a0a5] transition-colors">
              <span className="flex items-center gap-1">
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
    <div className="group mb-4 max-w-full">
      <div className="text-xs text-[#e0e0e3] whitespace-pre-wrap font-sans leading-relaxed px-2 py-1 break-words overflow-auto">
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
    <div className="mb-3 w-full">
      <div
        className={`group cursor-pointer rounded-[6px] backdrop-blur-xl w-full ${showSystemPrompt ? "bg-[#232326]/60 border border-[#323236]" : "bg-[#1e1e20]/50 border border-[#2a2a2c] hover:bg-[#232326]/40"}`}
        onClick={() => setShowSystemPrompt(!showSystemPrompt)}
      >
        <div className="flex items-center px-3 py-1.5 gap-1.5">
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            <FileText className="h-3 w-3 text-[#a0a0a5]" />
          </div>
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-[11px] font-medium text-[#c0c0c5]">
              System Prompt
            </span>
            <div className="flex items-center text-[#808085]">
              {showSystemPrompt ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </div>
          </div>
        </div>

        {showSystemPrompt && (
          <div className="px-8 pb-3 pt-1 text-[11px] text-[#a0a0a5] leading-relaxed border-t border-[#323236]">
            {systemPromptContent}
          </div>
        )}
      </div>
    </div>
  );
};

const Header = () => {
  return (
    <div className="relative z-10 backdrop-blur-xl bg-[#1a1a1c]/70 border-b border-[#2a2a2c]">
      <div className="flex items-center justify-between h-9 px-2">
        <div className="flex-1"></div>
        <div className="flex items-center bg-[#232326]/60 backdrop-blur-xl border border-[#323236] rounded-[6px] h-6 w-[280px] px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></div>
          <span className="font-mono text-[11px] text-[#e0e0e3]">
            localhost:4200
          </span>
          <div className="flex-1"></div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-[#a0a0a5] hover:text-[#e0e0e3] rounded-full"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-[#a0a0a5] hover:text-[#e0e0e3] rounded-full"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-[#a0a0a5] hover:text-[#e0e0e3] rounded-full"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Chat = () => {
  const { eventLog, inspector ,chatControls} = useChatStore();
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
    const isScrolledToBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 1;
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
    <div className="flex flex-col h-full bg-[#151515] relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-50%] left-[-30%] w-[100%] h-[100%] opacity-30 bg-gradient-to-br from-slate-800/20 via-slate-800/5 to-transparent blur-[150px]"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[100%] h-[80%] opacity-20 bg-gradient-to-tl from-slate-700/10 via-slate-700/5 to-transparent blur-[180px]"></div>
        <div className="absolute top-[10%] right-[5%] w-[50%] h-[50%] opacity-10 bg-gradient-to-bl from-indigo-800/5 via-slate-700/5 to-transparent blur-[120px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-slate-800/5 to-slate-900/10 opacity-30"></div>
      </div>

      <Header />

      <ScrollArea 
        className="flex-1 px-3 py-2 relative z-10 w-full overflow-x-hidden"
        onScroll={handleScroll}
      >
        <div className="space-y-3 pt-2 pb-1 w-full">
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

      <div className="px-3 pb-3 relative z-10 w-full">
        <div className="rounded-[6px] backdrop-blur-xl bg-[#232326]/60 border border-[#323236] shadow-sm shadow-black/5 overflow-hidden w-full">
          <div className="flex items-center px-1 py-0.5 border-b border-[#323236] bg-[#1e1e20]/30">
            <div className="flex-1 flex items-center gap-1 justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-1.5 py-0.5 rounded-md flex items-center ${
                        inspector.state.kind === "inspecting"
                          ? "text-[#949bf8] bg-[#949bf8]/10"
                          : "text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
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
                      <Inspect className="h-3 w-3 mr-0.5" />
                      <span className="text-[10px]">Select</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1 px-2 bg-[#232326]/95 text-[#c0c0c5] border-[#323236]"
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
                      className="h-6 px-1.5 py-0.5 rounded-md flex items-center text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
                    >
                      <Video className="h-3 w-3 mr-0.5" />
                      <span className="text-[10px]">Record</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1 px-2 bg-[#232326]/95 text-[#c0c0c5] border-[#323236]"
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
                      className="h-6 px-1.5 py-0.5 rounded-md flex items-center text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
                    >
                      <Camera className="h-3 w-3 mr-0.5" />
                      <span className="text-[10px]">Screenshot</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1 px-2 bg-[#232326]/95 text-[#c0c0c5] border-[#323236]"
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
                      className="h-6 px-1.5 py-0.5 rounded-md flex items-center text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
                    >
                      <PenTool className="h-3 w-3 mr-0.5" />
                      <span className="text-[10px]">Draw</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] py-1 px-2 bg-[#232326]/95 text-[#c0c0c5] border-[#323236]"
                  >
                    Draw on page
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex flex-col text-xs">
            <div className="relative min-h-[44px] w-full">
              <textarea
                ref={textareaRef}
                value={chatControls.state.input}
                onChange={(e) => chatControls.actions.setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="absolute top-0 left-0 w-full h-full pt-2.5 pl-3 pr-3 pb-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-xs text-[#e0e0e3] placeholder:text-[#808085] overflow-auto leading-relaxed"
                style={{
                  minHeight: "44px",
                  maxHeight: "100px",
                }}
              />
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#323236]">
              <div className="text-[10px] text-[#a0a0a5] flex items-center gap-1">
                <span>claude-3.7-sonnet</span>
                <ChevronDown className="h-3 w-3" />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!chatControls.state.input.trim()}
                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-medium backdrop-blur-xl bg-[#505057]/30 border border-[#606067]/30 hover:bg-[#606067]/40 text-[#e0e0e3] ${!chatControls.state.input.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>Send</span>
                <SendIcon className="ml-1 h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* <div
        className="[&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:rounded [&_pre]:p-2 [&_pre]:bg-[#1a1a1c] [&_pre]:border [&_pre]:border-[#333] [&_pre]:my-2
                    [&_code]:font-mono [&_code]:whitespace-pre-wrap [&_code]:break-words [&_code]:max-w-full [&_code]:inline-block
                    [&_img]:max-w-full [&_img]:h-auto
                    [&_table]:border-collapse [&_table]:my-2 [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:block
                    [&_th]:border [&_th]:border-[#333] [&_th]:p-1 [&_th]:text-xs
                    [&_td]:border [&_td]:border-[#333] [&_td]:p-1 [&_td]:text-xs"
      ></div> */}
    </div>
  );
};
