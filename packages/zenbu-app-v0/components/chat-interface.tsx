"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { 
  SendIcon, 
  ImageIcon, 
  HistoryIcon, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Plus, 
  Minimize, 
  Menu,
  Inspect,
  Terminal,
  Activity,
  X,
  BarChart,
  Camera,
  Video,
  Pencil
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Message {
  role: "user" | "assistant"
  content: string
  status?: "generating" | "done"
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    // {
    //   role: "assistant",
    //   content: "Hello! I'm your website building assistant. How can I help you today?",
    //   status: "done",
    // },
    {
      role: "user",
      content: "keep it black vercel design!",
      status: "done",
    }
  ])
  const [input, setInput] = useState("")
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [activeDevTool, setActiveDevTool] = useState<string | null>(null)
  const [activeDevToolsTab, setActiveDevToolsTab] = useState<string>("console")
  const [devToolHeight, setDevToolHeight] = useState<number>(120)
  const [isAnimating, setIsAnimating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // System prompt content
  const systemPromptContent = "You are a powerful agentic AI coding assistant, powered by Claude 3.7 Sonnet. You operate exclusively in Cursor, the world's best IDE. You are pair programming with a USER to solve their coding task. The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question. Focus on building a modern website with a clean dark interface similar to Vercel's design aesthetic."

  // Toggle dev tool
  const toggleDevTool = (tool: string) => {
    if (activeDevTool === tool) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveDevTool(null);
        setIsAnimating(false);
      }, 150); // Match animation duration
    } else {
      setIsAnimating(true);
      setActiveDevTool(tool);
      // Set different heights based on the tool
      if (tool === "devtools") {
        setDevToolHeight(120);
      } else if (tool === "screenshot" || tool === "record" || tool === "draw") {
        setDevToolHeight(120);
      } else {
        setDevToolHeight(120);
      }
      setTimeout(() => {
        setIsAnimating(false);
      }, 150); // Match animation duration
    }
  };

  // Switch between devtools tabs
  const switchDevToolsTab = (tab: string) => {
    setActiveDevToolsTab(tab);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { 
      role: "user", 
      content: input,
      status: "done",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add assistant message with generating status
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      status: "generating",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Simulate response generation
    setTimeout(() => {
      setMessages((prev) => prev.map((msg, idx) => 
        idx === prev.length - 1 
          ? { ...msg, content: "I've received your request. I'll help you build your website!", status: "done" }
          : msg
      ));
    }, 1000);

    setInput("");
    if (textareaRef.current && textareaRef.current.parentElement) {
      textareaRef.current.parentElement.style.height = "52px"; // Match the increased height
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat toolbar */}
      <div className="border-b border-zinc-800/50 bg-[#0a0a0a] px-2 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50">
                  <Menu className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] py-1 px-1.5">
                Chat options
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50">
                  <Minimize className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] py-1 px-1.5">
                Collapse chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 flex items-center gap-0.5"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
          >
            {showSystemPrompt ? "Hide" : "Show"} prompt
            {showSystemPrompt ? 
              <ChevronUp className="h-3 w-3 ml-0.5" /> : 
              <ChevronDown className="h-3 w-3 ml-0.5" />
            }
          </Button>
        </div>
        
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50">
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] py-1 px-1.5">
                Search in chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] py-1 px-1.5">
                New chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* System prompt content */}
      {showSystemPrompt && (
        <div className="px-3 py-2 text-[11px] text-zinc-400 border-b border-zinc-800/50 bg-zinc-900/30">
          <div className="flex items-center mb-1.5">
            <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center mr-1.5">
              <span className="text-[8px] text-zinc-300">U</span>
            </div>
            <span className="text-[11px] font-medium text-zinc-300">User</span>
          </div>
          <p className="pl-5.5 text-[11px] text-zinc-300 leading-tight">{systemPromptContent}</p>
        </div>
      )}
      
      {/* Chat messages */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 py-2">
          {messages.map((message, index) => (
            <div key={index}>
              {message.role === "user" ? (
                <div className="group mb-3">
                  <div className="rounded-md border border-zinc-800 bg-[#111111] overflow-hidden">
                    <div className="flex items-center px-2 py-1 border-b border-zinc-800/50 bg-zinc-800/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-[8px] text-zinc-300">U</span>
                        </div>
                        <span className="text-[11px] font-medium text-zinc-300">User</span>
                      </div>
                      <div className="ml-auto">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-300"
                        >
                          <HistoryIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <div className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-tight">{message.content}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="group mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-indigo-600/20 flex items-center justify-center">
                      <span className="text-[8px] text-indigo-400">AI</span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300">Claude</span>
                  </div>
                  <div className="pl-5.5">
                    {message.status === "generating" ? (
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-xs">•••</span>
                        <span className="text-xs">Generating</span>
                        <div className="flex-1"></div>
                        <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Stop</button>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-tight">{message.content}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="px-2 pb-2">
        {/* Integrated chat input with dev tools */}
        <div className="relative">
          {/* Chat input with integrated toolbar */}
          <div className="rounded-md bg-[#111111] border border-zinc-800 overflow-hidden">
            {/* Dev tools toolbar - integrated at the top of the input */}
            <div 
              className={`flex items-center px-2 py-1 border-b border-zinc-800/50 transition-colors duration-150 ${activeDevTool ? 'bg-zinc-800/20' : ''}`}
            >
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`h-6 w-6 p-0 ${
                    activeDevTool === "elements"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                  onClick={() => !isAnimating && toggleDevTool("elements")}
                >
                  <Inspect className="h-3.5 w-3.5" />
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`text-[11px] font-medium h-6 px-2 ${
                    activeDevTool === "devtools"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                  onClick={() => !isAnimating && toggleDevTool("devtools")}
                >
                  DevTools
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`text-[11px] font-medium h-6 px-2 ${
                    activeDevTool === "screenshot"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                  onClick={() => !isAnimating && toggleDevTool("screenshot")}
                >
                  Screenshot
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`text-[11px] font-medium h-6 px-2 ${
                    activeDevTool === "record"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                  onClick={() => !isAnimating && toggleDevTool("record")}
                >
                  Record
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`text-[11px] font-medium h-6 px-2 ${
                    activeDevTool === "draw"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                  onClick={() => !isAnimating && toggleDevTool("draw")}
                >
                  Draw
                </Button>
              </div>
              
              {activeDevTool && (
                <div className="ml-auto flex items-center">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    onClick={() => !isAnimating && toggleDevTool(activeDevTool || "")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Dev tool content area */}
            <div 
              className={`overflow-y-auto transition-all duration-150 ease-in-out ${
                activeDevTool 
                  ? 'px-3 py-2 text-[11px] text-zinc-400 border-b border-zinc-800/50 opacity-100' 
                  : 'p-0 border-0 opacity-0 h-0 pointer-events-none'
              }`}
              style={{ 
                height: activeDevTool ? `${devToolHeight}px` : '0px',
              }}
            >
              {activeDevTool === "elements" && (
                <div className="font-mono">
                  <div className="mb-1">&lt;<span className="text-blue-400">div</span> <span className="text-amber-400">className</span>=<span className="text-emerald-400">"flex flex-col h-full"</span>&gt;</div>
                  <div className="pl-3 mb-1">&lt;<span className="text-blue-400">div</span> <span className="text-amber-400">className</span>=<span className="text-emerald-400">"border-b border-zinc-800/50..."</span>&gt;...</div>
                  <div className="pl-3 mb-1">&lt;<span className="text-blue-400">ScrollArea</span> <span className="text-amber-400">className</span>=<span className="text-emerald-400">"flex-1 p-2"</span>&gt;...</div>
                  <div className="pl-3">&lt;<span className="text-blue-400">div</span> <span className="text-amber-400">className</span>=<span className="text-emerald-400">"px-2 pb-2"</span>&gt;...</div>
                </div>
              )}
              
              {activeDevTool === "devtools" && (
                <div>
                  {/* DevTools tabs */}
                  <div className="flex items-center gap-2 mb-2 border-b border-zinc-800/50 pb-1">
                    <button 
                      className={`text-[10px] px-1.5 py-0.5 rounded ${activeDevToolsTab === "console" ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:text-zinc-200"}`}
                      onClick={() => switchDevToolsTab("console")}
                    >
                      Console
                    </button>
                    <button 
                      className={`text-[10px] px-1.5 py-0.5 rounded ${activeDevToolsTab === "network" ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:text-zinc-200"}`}
                      onClick={() => switchDevToolsTab("network")}
                    >
                      Network
                    </button>
                    <button 
                      className={`text-[10px] px-1.5 py-0.5 rounded ${activeDevToolsTab === "performance" ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:text-zinc-200"}`}
                      onClick={() => switchDevToolsTab("performance")}
                    >
                      Performance
                    </button>
                  </div>
                  
                  {/* DevTools content based on active tab */}
                  {activeDevToolsTab === "console" && (
                    <div className="font-mono">
                      <div className="mb-1"><span className="text-zinc-500">›</span> <span className="text-blue-400">const</span> messages = <span className="text-amber-400">useState</span>([...])</div>
                      <div className="mb-1"><span className="text-zinc-500">›</span> <span className="text-blue-400">function</span> <span className="text-emerald-400">handleSendMessage</span>() &#123; ... &#125;</div>
                      <div className="text-yellow-400"><span className="text-zinc-500">⚠</span> Warning: Each child in a list should have a unique "key" prop.</div>
                    </div>
                  )}
                  
                  {activeDevToolsTab === "network" && (
                    <div className="font-mono">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-emerald-400">GET</span>
                        <span className="text-zinc-300">/api/chat</span>
                        <span className="text-zinc-500">200 OK</span>
                        <span className="text-zinc-500">42ms</span>
                      </div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-blue-400">POST</span>
                        <span className="text-zinc-300">/api/chat/message</span>
                        <span className="text-zinc-500">201 Created</span>
                        <span className="text-zinc-500">156ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400">GET</span>
                        <span className="text-zinc-300">/api/user/settings</span>
                        <span className="text-zinc-500">304 Not Modified</span>
                        <span className="text-zinc-500">28ms</span>
                      </div>
                    </div>
                  )}
                  
                  {activeDevToolsTab === "performance" && (
                    <div className="font-mono">
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-300">Memory Usage</span>
                          <span className="text-emerald-400">128MB</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                          <div className="bg-emerald-500 h-1.5 rounded-full w-1/4"></div>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-300">CPU Usage</span>
                          <span className="text-amber-400">42%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                          <div className="bg-amber-500 h-1.5 rounded-full w-2/5"></div>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-300">Render Time</span>
                          <span className="text-blue-400">24ms</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                          <div className="bg-blue-500 h-1.5 rounded-full w-1/6"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-300">Network Latency</span>
                          <span className="text-purple-400">156ms</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                          <div className="bg-purple-500 h-1.5 rounded-full w-3/5"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeDevTool === "screenshot" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-zinc-300 font-medium">Capture Screenshot</div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 px-2 text-[10px] border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Capture
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <input type="checkbox" id="include-browser" className="h-3 w-3 rounded border-zinc-700 bg-zinc-800" />
                      <label htmlFor="include-browser" className="text-zinc-400 text-[10px]">Include browser</label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="checkbox" id="full-page" className="h-3 w-3 rounded border-zinc-700 bg-zinc-800" />
                      <label htmlFor="full-page" className="text-zinc-400 text-[10px]">Full page</label>
                    </div>
                  </div>
                  <div className="text-zinc-500 text-[10px]">Screenshots will be saved to your downloads folder</div>
                </div>
              )}
              
              {activeDevTool === "record" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-zinc-300 font-medium">Screen Recording</div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 px-2 text-[10px] border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Start Recording
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <input type="checkbox" id="record-audio" className="h-3 w-3 rounded border-zinc-700 bg-zinc-800" />
                      <label htmlFor="record-audio" className="text-zinc-400 text-[10px]">Record audio</label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="checkbox" id="record-camera" className="h-3 w-3 rounded border-zinc-700 bg-zinc-800" />
                      <label htmlFor="record-camera" className="text-zinc-400 text-[10px]">Include camera</label>
                    </div>
                  </div>
                  <div className="text-zinc-500 text-[10px]">Recordings will be saved as .webm files</div>
                </div>
              )}
              
              {activeDevTool === "draw" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-zinc-300 font-medium">Drawing Mode</div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 px-2 text-[10px] border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Start Drawing
                    </Button>
                  </div>
                  <div className="mb-3">
                    <div className="text-zinc-400 text-[10px] mb-1.5">Brush Color</div>
                    <div className="flex items-center gap-2">
                      <button className="w-5 h-5 rounded-full bg-red-500 border border-zinc-700"></button>
                      <button className="w-5 h-5 rounded-full bg-yellow-500 border border-zinc-700"></button>
                      <button className="w-5 h-5 rounded-full bg-green-500 border border-zinc-700"></button>
                      <button className="w-5 h-5 rounded-full bg-blue-500 border border-zinc-700"></button>
                      <button className="w-5 h-5 rounded-full bg-purple-500 border border-zinc-700"></button>
                      <button className="w-5 h-5 rounded-full bg-white border border-zinc-700"></button>
                    </div>
                  </div>
                  <div className="text-zinc-500 text-[10px]">Draw on the website to highlight areas and provide visual feedback</div>
                </div>
              )}
            </div>

            {/* Text input area */}
            <div className="flex flex-col text-xs">
              <div className="relative min-h-[52px]">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hack away..."
                  className="absolute top-0 left-0 w-full h-full pt-2 pl-3 pr-3 pb-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-xs text-zinc-200 placeholder:text-zinc-500 overflow-auto"
                  style={{ 
                    lineHeight: '1.3',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    minHeight: '52px'
                  }}
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                    <span className="text-[11px] text-zinc-400">claude-3.7-sonnet</span>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
                <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 ${!input.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span>Send</span>
                    <svg className="ml-1.5" width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.5 8H2.5M13.5 8L9 3.5M13.5 8L9 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

