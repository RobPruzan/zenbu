"use client";

import type React from "react";

import {
  useState,
  useRef,
  useEffect,
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
} from "react";
import {
  SendIcon,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Minimize,
  Menu,
  X,
  Code,
  MessageSquare,
  FileText,
  Bug,
  Sparkles,
  RefreshCw,
  Zap,
  Inspect,
  BarChart2,
  Camera,
  Copy,
  PenTool,
  PanelRightOpen,
  Video,
} from "lucide-react";

import { flushSync } from "react-dom";
import { useChatStore } from "./chat-store";
import { ChatMessage } from "zenbu-plugin/src/ws/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Define local message type that includes status
interface Message {
  role: "user" | "assistant";
  content: string;
  status?: "generating" | "done";
}

// Ensure ChatMessage type includes our necessary properties
type EnhancedChatMessage = ChatMessage & {
  status?: "generating" | "done";
};

export const ChatContext = createContext<{
  messages: Array<ChatMessage>;
  setMessages: Dispatch<SetStateAction<Array<ChatMessage>>>;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
}>(null!);

// Define additional props for external control
interface ChatInterfaceProps {
  onClose?: () => void;
}

export default function ChatInterface({ onClose }: ChatInterfaceProps = {}) {
  const {
    messages: rawMessages,
    setMessages: setRawMessages,
    input,
    setInput,
  } = useChatContext();

  // Cast messages to include status property
  const messages = rawMessages as EnhancedChatMessage[];
  const setMessages = setRawMessages as Dispatch<
    SetStateAction<EnhancedChatMessage[]>
  >;

  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // System prompt content
  const systemPromptContent =
    "You are a powerful agentic AI coding assistant, powered by Claude 3.7 Sonnet. You operate exclusively in Cursor, the world's best IDE. You are pair programming with a USER to solve their coding task. The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question. Focus on building a modern website with a clean dark interface similar to Vercel's design aesthetic.";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      const parent = textareaRef.current.parentElement;
      if (parent) {
        parent.style.height = "52px"; // Increased default height for 2 rows
        const scrollHeight = textareaRef.current.scrollHeight;
        parent.style.height = `${Math.min(scrollHeight, 100)}px`; // Smaller max height
      }
    }
  }, [input]);

  // Ensure system prompt is visible when chat is empty
  // useEffect(() => {
  //   if (messages.length === 0 && !showSystemPrompt) {
  //     setShowSystemPrompt(true);
  //   }
  // }, [messages.length, showSystemPrompt]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: EnhancedChatMessage = {
      role: "user",
      content: input,
      status: "done",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add assistant message with generating status
    const assistantMessage: EnhancedChatMessage = {
      role: "assistant",
      content: "",
      status: "generating",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Simulate response generation
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1
            ? {
                ...msg,
                content:
                  "I've received your request. I'll help you build your website!",
                status: "done",
              }
            : msg,
        ),
      );
    }, 1000);

    setInput("");
    if (textareaRef.current && textareaRef.current.parentElement) {
      textareaRef.current.parentElement.style.height = "52px"; // Match the increased height
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const {} = useChatStore();

  return (
    <div className="flex flex-col h-full bg-[#151515] relative overflow-hidden">
      {/* Improved subtle background gradients - less blocky, more smooth */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Using larger, more diffused gradients with gentler opacity */}
        <div className="absolute top-[-50%] left-[-30%] w-[100%] h-[100%] opacity-30 bg-gradient-to-br from-slate-800/20 via-slate-800/5 to-transparent blur-[150px]"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[100%] h-[80%] opacity-20 bg-gradient-to-tl from-slate-700/10 via-slate-700/5 to-transparent blur-[180px]"></div>
        <div className="absolute top-[10%] right-[5%] w-[50%] h-[50%] opacity-10 bg-gradient-to-bl from-indigo-800/5 via-slate-700/5 to-transparent blur-[120px]"></div>

        {/* Subtle color tints */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-slate-800/5 to-slate-900/10 opacity-30"></div>

        {/* Noise texture overlay with mild graininess */}
        {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDgiLz48L3N2Zz4=')] opacity-50"></div> */}
      </div>

      {/* Header with improved glassy effect */}
      <div className="relative z-10 backdrop-blur-xl bg-[#1a1a1c]/70 border-b border-[#2a2a2c]">
        {/* URL bar with Xcode-style layout */}
        <div className="flex items-center justify-between h-9 px-2">
          <div className="flex-1"></div>
          {/* Centered URL bar with softer corners and better glass effect */}
          <div className="flex items-center bg-[#232326]/60 backdrop-blur-xl border border-[#323236] rounded-[6px] h-6 w-[280px] px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></div>
            <span className="font-mono text-[11px] text-[#e0e0e3]">
              localhost:4200
            </span>
            <div className="flex-1"></div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-[#a0a0a5] hover:text-[#e0e0e3]"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-end gap-1">
            <Button
              onClick={onClose}
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
              onClick={onClose}
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat messages with improved glassy effect */}
      <ScrollArea className="flex-1 px-3 py-2 relative z-10 w-full overflow-x-hidden">
        <div className="space-y-3 pt-2 pb-1 w-full">
          {/* System Prompt with improved glass styling */}
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

          {/* Regular messages with improved glassy effect */}
          {messages.map((message, index) => (
            <div key={index} className="mb-4 max-w-full">
              {message.role === "user" ? (
                <div className="group">
                  {/* Message container with distinct background */}
                  <div className="rounded-md bg-[#1e1e1e] border border-[#333333] overflow-hidden max-w-full">
                    {/* File context indicator */}
                    <div className="border-b border-[#333333] px-3 py-1 flex items-center overflow-hidden">
                      <FileText className="h-3 w-3 mr-1.5 flex-shrink-0 text-[#a0a0a5]" />
                      <span className="text-[10px] text-[#e0e0e3] font-medium truncate">
                        Context
                      </span>
                    </div>

                    {/* User message */}
                    <div className="px-3 py-2 text-xs text-[#e0e0e3] whitespace-pre-wrap font-sans leading-relaxed break-words overflow-auto">
                      {message.content}
                    </div>

                    {/* Footer with actions */}
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
              ) : (
                <div className="group max-w-full">
                  {/* AI response with streamlined design */}
                  <div className="text-xs text-[#e0e0e3] whitespace-pre-wrap font-sans leading-relaxed px-2 py-1 break-words overflow-auto">
                    {message.status === "generating" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block animate-pulse text-[#949bf8]">
                          Thinking
                        </span>
                        <span className="flex space-x-1">
                          <span
                            className="h-1 w-1 bg-[#949bf8]/70 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="h-1 w-1 bg-[#949bf8]/70 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="h-1 w-1 bg-[#949bf8]/70 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </span>
                      </div>
                    ) : (
                      <div className="overflow-hidden">{message.content}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Integrated chat input with improved glassy effect */}
      <div className="px-3 pb-3 relative z-10 w-full">
        <div className="rounded-[6px] backdrop-blur-xl bg-[#232326]/60 border border-[#323236] shadow-sm shadow-black/5 overflow-hidden w-full">
          {/* Page interaction tools with improved glassy effect */}
          <div className="flex items-center px-1 py-0.5 border-b border-[#323236] bg-[#1e1e20]/30">
            <div className="flex-1 flex items-center gap-1 justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* <Button
                  variant="ghost"
                  size="sm"
                      className={`h-6 px-1.5 py-0.5 rounded-md flex items-center ${inspectorState.kind === "inspecting" ? "text-[#949bf8] bg-[#949bf8]/10" : "text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"}`}
                      onClick={() =>
                        setInspectorState({
                          kind:
                            inspectorState.kind === "inspecting"
                              ? "off"
                              : "inspecting",
                        })
                      }
                >
                  <Inspect className="h-3 w-3 mr-0.5" />
                  <span className="text-[10px]">Select</span>
                </Button> */}
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

          {/* Text input area with improved glassy effect */}
          <div className="flex flex-col text-xs">
            <div className="relative min-h-[44px] w-full">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="absolute top-0 left-0 w-full h-full pt-2.5 pl-3 pr-3 pb-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-xs text-[#e0e0e3] placeholder:text-[#808085] overflow-auto"
                style={{
                  lineHeight: "1.5",
                  textAlign: "left",
                  boxSizing: "border-box",
                  minHeight: "44px",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  maxHeight: "100px",
                }}
              />
            </div>

            {/* Send controls with improved glassy effect */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#323236]">
              <div className="text-[10px] text-[#a0a0a5] flex items-center gap-1">
                <span>claude-3.7-sonnet</span>
                <ChevronDown className="h-3 w-3" />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-medium backdrop-blur-xl bg-[#505057]/30 border border-[#606067]/30 hover:bg-[#606067]/40 text-[#e0e0e3] ${!input.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>Send</span>
                <SendIcon className="ml-1 h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code highlighting and other special content handling */}
      <style jsx global>{`
        pre {
          overflow-x: auto;
          max-width: 100%;
          border-radius: 4px;
          padding: 0.5rem;
          background-color: #1a1a1c;
          border: 1px solid #333;
          margin: 0.5rem 0;
        }

        code {
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
          max-width: 100%;
          display: inline-block;
        }

        img {
          max-width: 100%;
          height: auto;
        }

        table {
          border-collapse: collapse;
          margin: 0.5rem 0;
          max-width: 100%;
          overflow-x: auto;
          display: block;
        }

        th,
        td {
          border: 1px solid #333;
          padding: 0.25rem;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [input, setInput] = useState("");

  return (
    <ChatContext.Provider value={{ messages, setMessages, input, setInput }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
