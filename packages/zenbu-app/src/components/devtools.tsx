"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { useChatContext } from "~/components/chat-interface";
import {
  Inspect,
  Terminal,
  Network,
  BarChart2,
  MessageSquare,
  Search,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Video,
  Clock,
  FileText,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { useChatStore } from "./chat-store";

// Add onClose prop to the component interface
interface DevToolsProps {
  onClose?: () => void;
}

export default function DevTools({ onClose }: DevToolsProps) {
  const { inspector } = useChatStore();
  const { setInput } = useChatContext();
  const [activeTab, setActiveTab] = useState("console");

  // Sample console logs with different types for demonstration
  const [consoleFilters, setConsoleFilters] = useState({
    errors: true,
    warnings: true,
    logs: true,
    info: true,
  });

  const [consoleHistory, setConsoleHistory] = useState([
    {
      id: 1,
      type: "info",
      content: "Application initialized",
      timestamp: "10:42:15",
    },
    {
      id: 2,
      type: "log",
      content: "User session started",
      timestamp: "10:42:16",
    },
    {
      id: 3,
      type: "warning",
      content:
        "Resource interpreted as Script but transferred with MIME type text/plain",
      timestamp: "10:42:18",
    },
    {
      id: 4,
      type: "error",
      content: "Failed to load resource: net::ERR_CONNECTION_REFUSED",
      timestamp: "10:42:20",
    },
    { id: 5, type: "log", content: "Component mounted", timestamp: "10:42:21" },
    {
      id: 6,
      type: "error",
      content: "TypeError: Cannot read property 'value' of undefined",
      timestamp: "10:42:25",
    },
    {
      id: 7,
      type: "log",
      content: "Data fetched successfully",
      timestamp: "10:42:30",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [consoleInput, setConsoleInput] = useState("");
  const [currentAiAnalysis, setCurrentAiAnalysis] = useState("");

  // Sample network requests for the network panel
  const [networkRequests, setNetworkRequests] = useState([
    {
      id: 1,
      method: "GET",
      url: "/api/users",
      status: 200,
      type: "fetch",
      duration: "45ms",
      size: "1.2KB",
      timestamp: "10:42:15",
    },
    {
      id: 2,
      method: "POST",
      url: "/api/auth/login",
      status: 200,
      type: "fetch",
      duration: "124ms",
      size: "0.8KB",
      timestamp: "10:42:20",
    },
    {
      id: 3,
      method: "GET",
      url: "/api/products",
      status: 404,
      type: "fetch",
      duration: "89ms",
      size: "0.2KB",
      timestamp: "10:42:25",
    },
    {
      id: 4,
      method: "GET",
      url: "/assets/images/logo.svg",
      status: 200,
      type: "resource",
      duration: "35ms",
      size: "4.5KB",
      timestamp: "10:42:30",
    },
    {
      id: 5,
      method: "POST",
      url: "/api/analytics",
      status: 500,
      type: "fetch",
      duration: "150ms",
      size: "0.3KB",
      timestamp: "10:42:35",
    },
  ]);

  // Sample performance data for the performance panel
  const [performanceData, setPerformanceData] = useState({
    interactions: [
      {
        id: 1,
        type: "click",
        target: "Button",
        time: "10:42:15",
        duration: "64ms",
      },
      {
        id: 2,
        type: "input",
        target: "SearchField",
        time: "10:42:20",
        duration: "12ms",
      },
      {
        id: 3,
        type: "hover",
        target: "Dropdown",
        time: "10:42:25",
        duration: "8ms",
      },
      {
        id: 4,
        type: "click",
        target: "MenuItem",
        time: "10:42:30",
        duration: "42ms",
      },
      {
        id: 5,
        type: "scroll",
        target: "ProductList",
        time: "10:42:35",
        duration: "124ms",
      },
    ],
    components: [
      { name: "Button", renders: 12, totalTime: "24ms", avgTime: "2ms" },
      { name: "DevTools", renders: 1, totalTime: "2ms", avgTime: "2ms" },
      { name: "_c", renders: 32, totalTime: "1ms", avgTime: "0.03ms" },
      { name: "PanelGroup", renders: 3, totalTime: "1ms", avgTime: "0.3ms" },
      { name: "ChevronDown", renders: 5, totalTime: "1ms", avgTime: "0.2ms" },
      { name: "Home", renders: 1, totalTime: "1ms", avgTime: "1ms" },
      {
        name: "Primitive.div",
        renders: 25,
        totalTime: "1ms",
        avgTime: "0.04ms",
      },
    ],
  });

  // Handle console search
  const filteredLogs = consoleHistory.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      (log.type === "error" && consoleFilters.errors) ||
      (log.type === "warning" && consoleFilters.warnings) ||
      (log.type === "log" && consoleFilters.logs) ||
      (log.type === "info" && consoleFilters.info);

    return matchesSearch && matchesFilter;
  });

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    // Add user input to console
    setConsoleHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "log",
        content: `> ${consoleInput}`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    ]);
    setConsoleInput("");
  };

  // const toggleInspector = () => {
  //   setInspectorState((prev) => ({
  //     kind: prev.kind === "inspecting" ? "off" : "inspecting",
  //   }));
  // };

  const analyzeConsoleError = (errorMessage: string) => {
    setCurrentAiAnalysis(`Analyzing: "${errorMessage}"`);
    setInput(
      `Please analyze this error and suggest how to fix it: ${errorMessage}`,
    );
  };

  const analyzeNetworkError = (request: any) => {
    setCurrentAiAnalysis(
      `Analyzing network request: ${request.method} ${request.url} (Status: ${request.status})`,
    );
    setInput(
      `Please analyze this failed network request and suggest how to fix it: ${request.method} ${request.url} returned status ${request.status}`,
    );
  };

  // Status tags with Vision OS styling
  const StatusTag = ({
    status,
    children,
  }: {
    status: "error" | "warning" | "success" | "info";
    children: React.ReactNode;
  }) => {
    const statusStyles = {
      error: "border-red-500/30 bg-red-500/20 text-red-400",
      warning: "border-amber-500/30 bg-amber-500/20 text-amber-400",
      success: "border-emerald-500/30 bg-emerald-500/20 text-emerald-400",
      info: "border-blue-500/30 bg-blue-500/20 text-blue-400",
    };

    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-light border ${statusStyles[status]} backdrop-blur-xl`}
      >
        {children}
      </span>
    );
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Background with VisionOS-style blur effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Darker solid background */}
        <div className="absolute inset-0 bg-[#080809]"></div>
        
        {/* Glass blur effect layer with distortion */}
        <div className="absolute inset-0 backdrop-filter backdrop-blur-lg"></div>
      </div>

      <Tabs
        defaultValue="console"
        value={activeTab}
        onValueChange={setActiveTab}
        className="relative z-10 flex flex-1 flex-col"
      >
        {/* Unified DevTools Header with Tabs */}
        <div className="flex items-center border-b border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)] backdrop-blur-xl">
          {/* Left side - tab navigation */}
          <div className="flex flex-1 items-center">
            <TabsList className="h-9 justify-start rounded-none border-0 bg-transparent p-0">
              <TabsTrigger
                value="console"
                className="h-9 rounded-none px-3 text-[11px] font-light text-[#A1A1A6] data-[state=active]:bg-[rgba(30,30,34,0.55)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200"
              >
                <Terminal className="mr-1.5 h-3.5 w-3.5" />
                Console
              </TabsTrigger>
              <TabsTrigger
                value="network"
                className="h-9 rounded-none px-3 text-[11px] font-light text-[#A1A1A6] data-[state=active]:bg-[rgba(30,30,34,0.55)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200"
              >
                <Network className="mr-1.5 h-3.5 w-3.5" />
                Network
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="h-9 rounded-none px-3 text-[11px] font-light text-[#A1A1A6] data-[state=active]:bg-[rgba(30,30,34,0.55)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200"
              >
                <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
                Performance
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right side - controls */}
          <div className="flex h-9 items-center gap-1 px-2">
            {currentAiAnalysis && (
              <div className="mr-2 flex items-center">
                <div className="flex animate-pulse items-center rounded-full bg-[rgba(30,30,34,0.55)] border border-[rgba(255,255,255,0.04)] px-2 py-1 text-[11px] text-blue-400">
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-blue-400" />
                  {currentAiAnalysis}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="flex h-7 w-7 items-center justify-center rounded-full p-0 text-[#A1A1A6] hover:bg-[rgba(40,40,46,0.7)] hover:text-white backdrop-blur-xl border border-[rgba(255,255,255,0.04)] transition-all duration-300"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tab Content Area */}
        <TabsContent value="console" className="m-0 flex-1 border-0 p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)] px-2 py-1">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 rounded-full text-[11px] font-light text-[#A1A1A6] hover:bg-[rgba(40,40,46,0.7)] hover:text-white border border-[rgba(255,255,255,0.04)] transition-all duration-300"
                  onClick={() => setConsoleHistory([])}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Clear
                </Button>

                <div className="ml-2 flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setConsoleFilters((prev) => ({
                        ...prev,
                        errors: !prev.errors,
                      }))
                    }
                    className={`rounded-full px-2 py-0.5 text-[11px] font-light transition-all duration-200 ${consoleFilters.errors ? "border border-red-500/30 bg-red-500/20 text-red-400" : "border border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)] text-[#A1A1A6]"}`}
                  >
                    Errors
                  </button>
                  <button
                    onClick={() =>
                      setConsoleFilters((prev) => ({
                        ...prev,
                        warnings: !prev.warnings,
                      }))
                    }
                    className={`rounded-full px-2 py-0.5 text-[11px] font-light transition-all duration-200 ${consoleFilters.warnings ? "border border-amber-500/30 bg-amber-500/20 text-amber-400" : "border border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)] text-[#A1A1A6]"}`}
                  >
                    Warnings
                  </button>
                  <button
                    onClick={() =>
                      setConsoleFilters((prev) => ({
                        ...prev,
                        logs: !prev.logs,
                      }))
                    }
                    className={`rounded-full px-2 py-0.5 text-[11px] font-light transition-all duration-200 ${consoleFilters.logs ? "border border-blue-500/30 bg-blue-500/20 text-blue-400" : "border border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)] text-[#A1A1A6]"}`}
                  >
                    Logs
                  </button>
                  <button
                    onClick={() =>
                      setConsoleFilters((prev) => ({
                        ...prev,
                        info: !prev.info,
                      }))
                    }
                    className={`rounded-full px-2 py-0.5 text-[11px] font-light transition-all duration-200 ${consoleFilters.info ? "border border-green-500/30 bg-green-500/20 text-green-400" : "border border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)] text-[#A1A1A6]"}`}
                  >
                    Info
                  </button>
                </div>
              </div>

              <div className="relative w-[200px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-[#808085]" />
                <Input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-7 rounded-xl border-[rgba(255,255,255,0.04)] bg-[#121214] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] pl-8 text-[11px] font-light text-white placeholder:text-[#A1A1A6] focus-visible:ring-1 focus-visible:ring-[rgba(255,255,255,0.08)] focus-visible:ring-offset-0 transform hover:translate-y-[-1px] transition-all duration-300"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 bg-[rgba(20,20,22,0.4)] backdrop-filter backdrop-blur-md">
              <div className="p-0 font-mono text-[12px] font-light">
                {filteredLogs.length === 0 ? (
                  <div className="p-3 text-center text-[#808085]">
                    No matching logs found
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`group flex items-start border-b border-[rgba(255,255,255,0.03)] px-3 py-2 ${
                        log.type === "error"
                          ? "bg-red-500/5 text-red-400"
                          : log.type === "warning"
                            ? "bg-amber-500/5 text-amber-400"
                            : log.type === "info"
                              ? "text-green-400"
                              : "text-white"
                      }`}
                    >
                      <div className="w-12 flex-shrink-0 text-[10px] text-[#808085]">
                        {log.timestamp}
                      </div>
                      <div className="flex-1 overflow-hidden whitespace-pre-wrap break-words pr-2">
                        {log.content}
                      </div>

                      {(log.type === "error" || log.type === "warning") && (
                        <button
                          className="flex items-center rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(40,40,46,0.8)] px-2 py-0.5 text-[10px] font-light text-[#F2F2F7] opacity-0 transition-opacity backdrop-blur-xl group-hover:opacity-100 hover:bg-[rgba(48,48,54,0.85)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
                          onClick={() => analyzeConsoleError(log.content)}
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          Analyze
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)] p-2">
              <form onSubmit={handleConsoleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  placeholder="Execute JavaScript..."
                  className="h-8 rounded-xl border-[rgba(255,255,255,0.04)] bg-[#121214] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] text-[12px] font-light text-white placeholder:text-[#A1A1A6] focus-visible:ring-1 focus-visible:ring-[rgba(255,255,255,0.08)] focus-visible:ring-offset-0 transform hover:translate-y-[-1px] transition-all duration-300"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full border-[rgba(255,255,255,0.05)] bg-[rgba(40,40,46,0.8)] px-3.5 text-[11px] font-light text-white hover:bg-[rgba(48,48,54,0.85)] hover:text-white backdrop-blur-xl hover:shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition-all duration-300"
                >
                  Run
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* Network Tab Content */}
        <TabsContent value="network" className="m-0 flex-1 border-0 p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)] px-2 py-1">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 rounded-full text-[11px] font-light text-[#A1A1A6] hover:bg-[rgba(40,40,46,0.7)] hover:text-white border border-[rgba(255,255,255,0.04)] transition-all duration-300"
                  onClick={() => setNetworkRequests([])}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>

              <div className="relative w-[200px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-[#808085]" />
                <Input
                  type="text"
                  placeholder="Filter requests..."
                  className="h-7 rounded-xl border-[rgba(255,255,255,0.04)] bg-[#121214] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] pl-8 text-[11px] font-light text-white placeholder:text-[#A1A1A6] focus-visible:ring-1 focus-visible:ring-[rgba(255,255,255,0.08)] focus-visible:ring-offset-0 transform hover:translate-y-[-1px] transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[rgba(20,20,22,0.4)] backdrop-filter backdrop-blur-md">
              {networkRequests.length === 0 ? (
                <div className="p-3 text-center text-[12px] font-light text-[#808085]">
                  No network requests recorded
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {networkRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`rounded-xl p-3 ${
                        request.status >= 400
                          ? "border border-red-500/20 bg-[rgba(24,24,26,0.6)]"
                          : request.status >= 300
                            ? "border border-amber-500/20 bg-[rgba(24,24,26,0.6)]"
                            : "border border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)]"
                      } group hover:bg-[rgba(30,30,34,0.55)] transition-all duration-200 backdrop-blur-xl`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-light ${
                              request.method === "GET"
                                ? "border border-blue-500/30 bg-blue-500/20 text-blue-400"
                                : request.method === "POST"
                                  ? "border border-green-500/30 bg-green-500/20 text-green-400"
                                  : request.method === "PUT"
                                    ? "border border-amber-500/30 bg-amber-500/20 text-amber-400"
                                    : "border border-purple-500/30 bg-purple-500/20 text-purple-400"
                            }`}
                          >
                            {request.method}
                          </span>
                          <span className="max-w-[200px] truncate text-[11px] font-light text-white">
                            {request.url}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-light ${
                              request.status >= 400
                                ? "border border-red-500/20 bg-red-500/10 text-red-400"
                                : request.status >= 300
                                  ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                                  : "border border-green-500/20 bg-green-500/10 text-green-400"
                            }`}
                          >
                            {request.status}
                          </span>
                          <span className="text-[10px] text-[#A1A1A6]">
                            {request.duration}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#808085]">
                            {request.timestamp}
                          </span>
                          <span className="text-[10px] text-[#808085]">
                            {request.type}
                          </span>
                          <span className="text-[10px] text-[#808085]">
                            {request.size}
                          </span>
                        </div>

                        {request.status >= 400 && (
                          <button
                            className="flex items-center rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(40,40,46,0.8)] px-2 py-0.5 text-[10px] font-light text-[#F2F2F7] opacity-0 transition-opacity backdrop-blur-xl group-hover:opacity-100 hover:bg-[rgba(48,48,54,0.85)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
                            onClick={() => analyzeNetworkError(request)}
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            Fix Error
                          </button>
                        )}
                      </div>

                      {/* Simple request details - expandable in a real implementation */}
                      {request.status >= 400 && (
                        <div className="mt-2 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)] p-2 text-[11px] font-light text-red-400">
                          Error:{" "}
                          {request.status === 404
                            ? "Resource not found"
                            : "Server error"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab Content */}
        <TabsContent value="performance" className="m-0 flex-1 border-0 p-0">
          <div className="flex h-full">
            {/* Left Panel - Interaction History */}
            <div className="w-[30%] border-r border-[rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)] px-3 py-1.5">
                <span className="text-[11px] font-light text-white">
                  Interactions
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 rounded-full p-0 text-[#A1A1A6] hover:bg-[rgba(40,40,46,0.7)] hover:text-white border border-[rgba(255,255,255,0.04)] transition-all duration-300"
                >
                  <Video className="h-3.5 w-3.5" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100%-32px)] bg-[rgba(20,20,22,0.4)] backdrop-filter backdrop-blur-md">
                <div className="space-y-0">
                  {performanceData.interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="flex cursor-pointer items-center border-b border-[rgba(255,255,255,0.03)] px-3 py-2 hover:bg-[rgba(30,30,34,0.55)] transition-all duration-200"
                    >
                      <div className="mr-2.5 flex h-4 w-4 items-center justify-center">
                        {interaction.type === "click" && (
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-400"></div>
                        )}
                        {interaction.type === "input" && (
                          <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
                        )}
                        {interaction.type === "hover" && (
                          <div className="h-2.5 w-2.5 rounded-full bg-purple-400"></div>
                        )}
                        {interaction.type === "scroll" && (
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-light text-white">
                            {interaction.target}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-light ${
                              parseInt(interaction.duration) > 50
                                ? "border border-red-500/20 bg-red-500/10 text-red-400"
                                : parseInt(interaction.duration) > 20
                                  ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                                  : "border border-green-500/20 bg-green-500/10 text-green-400"
                            }`}
                          >
                            {interaction.duration}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between">
                          <span className="text-[10px] text-[#808085]">
                            {interaction.type}
                          </span>
                          <span className="text-[10px] text-[#808085]">
                            {interaction.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Component Renders Ranking */}
            <div className="flex-1">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)] px-3 py-1.5">
                <span className="text-[11px] font-light text-white">
                  Ranked Components
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#A1A1A6]">Sort by:</span>
                  <select className="h-6 rounded-full border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)] px-2 text-[10px] font-light text-white focus-visible:ring-1 focus-visible:ring-[rgba(255,255,255,0.08)] focus-visible:ring-offset-0">
                    <option>Renders</option>
                    <option>Total Time</option>
                    <option>Avg Time</option>
                  </select>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-32px)] bg-[rgba(20,20,22,0.4)] backdrop-filter backdrop-blur-md">
                <div className="space-y-2 p-3">
                  {performanceData.components.map((component, index) => (
                    <div
                      key={index}
                      className="group rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(24,24,26,0.6)] p-3 hover:bg-[rgba(30,30,34,0.55)] transition-all duration-200 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-light text-white">
                            {component.name}
                          </span>
                          <span className="rounded-full border border-[rgba(255,255,255,0.04)] bg-[rgba(30,30,34,0.55)] px-2 py-0.5 text-[10px] font-light text-[#A1A1A6]">
                            x{component.renders}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A1A1A6]">
                          {component.totalTime}
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="mb-1 flex justify-between text-[10px] text-[#A1A1A6]">
                          <span>Render time (avg: {component.avgTime})</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[rgba(30,30,34,0.55)]">
                          <div
                            className={`${
                              parseFloat(component.avgTime) > 1.5
                                ? "bg-red-500"
                                : parseFloat(component.avgTime) > 0.5
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            } h-1.5 rounded-full`}
                            style={{
                              width: `${Math.min(parseFloat(component.avgTime) * 50, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-2 text-right text-[10px]">
                        <button className="rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(40,40,46,0.8)] px-2 py-0.5 text-[10px] font-light text-[#F2F2F7] opacity-0 transition-opacity backdrop-blur-xl group-hover:opacity-100 hover:bg-[rgba(48,48,54,0.85)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
                          View details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
