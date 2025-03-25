"use client";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../chat-instance-context";
import { iife } from "~/lib/utils";
import { useEventWS } from "~/app/ws";
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
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ChatMessage, toChatMessages } from "zenbu-plugin/src/ws/utils";
import { Header } from "./header";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

type ClientEventType = {
  requestId: string;
  context: string[];
  kind: "user-message";
  text: string;
  timestamp: number;
  id: string;
  previousEvents: any[];
};

export const Chat = ({ onCloseChat }: { onCloseChat: () => void }) => {
  const { eventLog, inspector, chatControls } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  
  const mentionOptions = [
    { id: "network", display: "Network" },
    { id: "console", display: "Console" },
    { id: "performance", display: "Performance" },
    { id: "memory", display: "Memory" },
    { id: "storage", display: "Storage" },
    { id: "accessibility", display: "Accessibility" },
  ];

  const filteredMentions = mentionFilter 
    ? mentionOptions.filter(option => 
        option.id.toLowerCase().includes(mentionFilter.toLowerCase()) || 
        option.display.toLowerCase().includes(mentionFilter.toLowerCase()))
    : mentionOptions;

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

  useEffect(() => {
    // Check for @ symbol in the input
    const inputText = chatControls.state.input;
    const atIndex = inputText.lastIndexOf('@');
    
    if (atIndex !== -1 && (atIndex === 0 || inputText[atIndex - 1] === ' ')) {
      // Extract the text after @ to filter suggestions
      const filterText = inputText.slice(atIndex + 1).split(' ')[0];
      setMentionFilter(filterText || "");
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  }, [chatControls.state.input]);

  const insertMention = (mention: string) => {
    const inputText = chatControls.state.input;
    const atIndex = inputText.lastIndexOf('@');
    
    if (atIndex !== -1) {
      // Find the end of the current mention being typed
      const textAfterAt = inputText.substring(atIndex + 1);
      const spaceMatch = textAfterAt.match(/\s/);
      const spaceIndex = spaceMatch ? spaceMatch.index! : textAfterAt.length;
      
      // Construct the new input text with the chosen mention
      const beforeMention = inputText.substring(0, atIndex);
      const afterMention = inputText.substring(atIndex + 1 + spaceIndex);
      
      const newInput = `${beforeMention}@${mention} ${afterMention}`;
      chatControls.actions.setInput(newInput);
    }
    
    setShowMentionSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSendMessage = () => {
    if (!chatControls.state.input.trim() || !socket) return;

    // Extract @mentions from the input
    const mentions: string[] = [];
    const regex = /@(\w+)/g;
    let match;
    
    while ((match = regex.exec(chatControls.state.input)) !== null) {
      mentions.push(match[1]);
    }

    const clientEvent: ClientEventType = {
      requestId: nanoid(),
      context: mentions, // Use the extracted mentions as context
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
                placeholder="Ask me anything... (Use @ to include context)"
                className="absolute top-0 left-0 w-full h-full pt-3.5 pl-4 pr-4 pb-1.5 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-xs text-[#F2F2F7] placeholder:text-[rgba(161,161,166,0.8)] overflow-auto leading-relaxed font-light"
                style={{
                  minHeight: "50px",
                  maxHeight: "100px",
                }}
              />
              {showMentionSuggestions && (
                <div className="absolute bottom-full left-4 mb-1 bg-[rgba(30,30,34,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-lg shadow-lg z-50">
                  <div className="max-h-[150px] overflow-y-auto py-1">
                    {filteredMentions.length > 0 ? (
                      filteredMentions.map((option) => (
                        <div
                          key={option.id}
                          className="px-3 py-1.5 hover:bg-[rgba(50,50,56,0.8)] cursor-pointer text-xs text-[#F2F2F7] font-light"
                          onClick={() => insertMention(option.id)}
                        >
                          @{option.display}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-1.5 text-xs text-[#A1A1A6] font-light">No matches</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-4 py-2 border-t border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // TODO: Implement schedule functionality
                    console.log("Schedule task clicked");
                  }}
                  className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light backdrop-blur-xl bg-[rgba(40,40,46,0.8)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(48,48,54,0.85)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.25)] text-white transition-all duration-300"
                >
                  <Clock className="h-3 w-3 mr-1.5" />
                  <span>Task</span>
                </button>
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
    </div>
  );
};