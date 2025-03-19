"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useInspectorStateContext } from "@/app/iframe-wrapper";
import { useChatContext } from "@/components/chat-interface";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

// Add onClose prop to the component interface
interface DevToolsProps {
  onClose?: () => void;
}

export default function DevTools({ onClose }: DevToolsProps) {
  const { inspectorState, setInspectorState } = useInspectorStateContext();
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
    { id: 1, type: "info", content: "Application initialized", timestamp: "10:42:15" },
    { id: 2, type: "log", content: "User session started", timestamp: "10:42:16" },
    { id: 3, type: "warning", content: "Resource interpreted as Script but transferred with MIME type text/plain", timestamp: "10:42:18" },
    { id: 4, type: "error", content: "Failed to load resource: net::ERR_CONNECTION_REFUSED", timestamp: "10:42:20" },
    { id: 5, type: "log", content: "Component mounted", timestamp: "10:42:21" },
    { id: 6, type: "error", content: "TypeError: Cannot read property 'value' of undefined", timestamp: "10:42:25" },
    { id: 7, type: "log", content: "Data fetched successfully", timestamp: "10:42:30" },
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [consoleInput, setConsoleInput] = useState("");
  const [currentAiAnalysis, setCurrentAiAnalysis] = useState("");

  // Sample network requests for the network panel
  const [networkRequests, setNetworkRequests] = useState([
    { id: 1, method: "GET", url: "/api/users", status: 200, type: "fetch", duration: "45ms", size: "1.2KB", timestamp: "10:42:15" },
    { id: 2, method: "POST", url: "/api/auth/login", status: 200, type: "fetch", duration: "124ms", size: "0.8KB", timestamp: "10:42:20" },
    { id: 3, method: "GET", url: "/api/products", status: 404, type: "fetch", duration: "89ms", size: "0.2KB", timestamp: "10:42:25" },
    { id: 4, method: "GET", url: "/assets/images/logo.svg", status: 200, type: "resource", duration: "35ms", size: "4.5KB", timestamp: "10:42:30" },
    { id: 5, method: "POST", url: "/api/analytics", status: 500, type: "fetch", duration: "150ms", size: "0.3KB", timestamp: "10:42:35" },
  ]);
  
  // Sample performance data for the performance panel
  const [performanceData, setPerformanceData] = useState({
    interactions: [
      { id: 1, type: "click", target: "Button", time: "10:42:15", duration: "64ms" },
      { id: 2, type: "input", target: "SearchField", time: "10:42:20", duration: "12ms" },
      { id: 3, type: "hover", target: "Dropdown", time: "10:42:25", duration: "8ms" },
      { id: 4, type: "click", target: "MenuItem", time: "10:42:30", duration: "42ms" },
      { id: 5, type: "scroll", target: "ProductList", time: "10:42:35", duration: "124ms" },
    ],
    components: [
      { name: "Button", renders: 12, totalTime: "24ms", avgTime: "2ms" },
      { name: "DevTools", renders: 1, totalTime: "2ms", avgTime: "2ms" },
      { name: "_c", renders: 32, totalTime: "1ms", avgTime: "0.03ms" },
      { name: "PanelGroup", renders: 3, totalTime: "1ms", avgTime: "0.3ms" },
      { name: "ChevronDown", renders: 5, totalTime: "1ms", avgTime: "0.2ms" },
      { name: "Home", renders: 1, totalTime: "1ms", avgTime: "1ms" },
      { name: "Primitive.div", renders: 25, totalTime: "1ms", avgTime: "0.04ms" },
    ]
  });

  // Handle console search
  const filteredLogs = consoleHistory.filter(log => {
    const matchesSearch = searchTerm === "" || log.content.toLowerCase().includes(searchTerm.toLowerCase());
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
    setConsoleHistory(prev => [
      ...prev,
      { id: Date.now(), type: "log", content: `> ${consoleInput}`, timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    ]);
    setConsoleInput("");
  };

  const toggleInspector = () => {
    setInspectorState(prev => ({
      kind: prev.kind === "inspecting" ? "off" : "inspecting",
    }));
  };

  const analyzeConsoleError = (errorMessage: string) => {
    setCurrentAiAnalysis(`Analyzing: "${errorMessage}"`);
    setInput(`Please analyze this error and suggest how to fix it: ${errorMessage}`);
  };

  const analyzeNetworkError = (request: any) => {
    setCurrentAiAnalysis(`Analyzing network request: ${request.method} ${request.url} (Status: ${request.status})`);
    setInput(`Please analyze this failed network request and suggest how to fix it: ${request.method} ${request.url} returned status ${request.status}`);
  };

  return (
    <div className="h-full flex flex-col bg-[#151515] relative overflow-hidden">
      {/* Background gradients (matching chat interface) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-50%] left-[-30%] w-[100%] h-[100%] opacity-30 bg-gradient-to-br from-slate-800/20 via-slate-800/5 to-transparent blur-[150px]"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[100%] h-[80%] opacity-20 bg-gradient-to-tl from-slate-700/10 via-slate-700/5 to-transparent blur-[180px]"></div>
        <div className="absolute top-[10%] right-[5%] w-[50%] h-[50%] opacity-10 bg-gradient-to-bl from-indigo-800/5 via-slate-700/5 to-transparent blur-[120px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-slate-800/5 to-slate-900/10 opacity-30"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>
      </div>

      <Tabs defaultValue="console" value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 relative z-10">
        {/* Unified DevTools Header with Tabs */}
        <div className="flex items-center bg-[#1d1d1f] border-b border-[#323236]">
          {/* Left side - tab navigation */}
          <div className="flex-1 flex items-center">
            <TabsList className="bg-transparent h-9 p-0 justify-start rounded-none border-0">
              <TabsTrigger 
                value="console" 
                className="rounded-none px-3 h-9 text-[11px] font-medium data-[state=active]:bg-[#262628] data-[state=active]:text-white data-[state=active]:shadow-none text-[#bbbbbd]"
              >
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                Console
              </TabsTrigger>
              <TabsTrigger 
                value="network" 
                className="rounded-none px-3 h-9 text-[11px] font-medium data-[state=active]:bg-[#262628] data-[state=active]:text-white data-[state=active]:shadow-none text-[#bbbbbd]"
              >
                <Network className="h-3.5 w-3.5 mr-1.5" />
                Network
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="rounded-none px-3 h-9 text-[11px] font-medium data-[state=active]:bg-[#262628] data-[state=active]:text-white data-[state=active]:shadow-none text-[#bbbbbd]"
              >
                <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                Performance
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right side - controls */}
          <div className="flex items-center h-9 px-2 gap-1">
            {inspectorState.kind === "inspecting" && (
              <span className="text-[11px] mr-2 font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                Selecting Element
              </span>
            )}
            {currentAiAnalysis && (
              <div className="mr-2 flex items-center">
                <div className="text-[11px] text-blue-400 animate-pulse flex items-center">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-400" />
                  {currentAiAnalysis}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 rounded-md flex items-center justify-center ${inspectorState.kind === "inspecting" ? "text-blue-400 bg-blue-500/10" : "text-[#bbbbbd] hover:text-white hover:bg-[#323236]"}`}
              onClick={toggleInspector}
            >
              <Inspect className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-md flex items-center justify-center text-[#bbbbbd] hover:text-white hover:bg-[#323236]"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Content Area */}
        <TabsContent value="console" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-2 py-1 border-b border-[#323236] bg-[#1d1d1f]">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] text-[#bbbbbd] hover:text-white hover:bg-[#323236]"
                  onClick={() => setConsoleHistory([])}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Clear
                </Button>
                
                <div className="flex items-center gap-1.5 ml-2">
                  <button 
                    onClick={() => setConsoleFilters(prev => ({...prev, errors: !prev.errors}))}
                    className={`px-2 py-0.5 rounded text-[11px] ${consoleFilters.errors ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#262628] text-[#bbbbbd] border border-[#323236]'}`}
                  >
                    Errors
                  </button>
                  <button 
                    onClick={() => setConsoleFilters(prev => ({...prev, warnings: !prev.warnings}))}
                    className={`px-2 py-0.5 rounded text-[11px] ${consoleFilters.warnings ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-[#262628] text-[#bbbbbd] border border-[#323236]'}`}
                  >
                    Warnings
                  </button>
                  <button 
                    onClick={() => setConsoleFilters(prev => ({...prev, logs: !prev.logs}))}
                    className={`px-2 py-0.5 rounded text-[11px] ${consoleFilters.logs ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-[#262628] text-[#bbbbbd] border border-[#323236]'}`}
                  >
                    Logs
                  </button>
                  <button 
                    onClick={() => setConsoleFilters(prev => ({...prev, info: !prev.info}))}
                    className={`px-2 py-0.5 rounded text-[11px] ${consoleFilters.info ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#262628] text-[#bbbbbd] border border-[#323236]'}`}
                  >
                    Info
                  </button>
                </div>
              </div>
              
              <div className="relative w-[200px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#808085]" />
                <Input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-7 pl-8 text-[11px] bg-[#262628] border-[#323236] focus-visible:ring-1 focus-visible:ring-[#4f4f52] focus-visible:ring-offset-0 text-white placeholder:text-[#808085] rounded"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-0 font-mono text-[12px]">
                {filteredLogs.length === 0 ? (
                  <div className="p-3 text-center text-[#808085]">
                    No matching logs found
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`px-3 py-2 border-b border-[#323236] flex items-start group ${
                        log.type === 'error' ? 'text-red-400 bg-red-500/5' : 
                        log.type === 'warning' ? 'text-amber-400 bg-amber-500/5' : 
                        log.type === 'info' ? 'text-green-400' : 
                        'text-white'
                      }`}
                    >
                      <div className="w-12 flex-shrink-0 text-[10px] text-[#808085]">
                        {log.timestamp}
                      </div>
                      <div className="flex-1 break-words whitespace-pre-wrap overflow-hidden pr-2">
                        {log.content}
                      </div>
                      
                      {(log.type === 'error' || log.type === 'warning') && (
                        <button 
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 text-[10px] text-blue-400"
                          onClick={() => analyzeConsoleError(log.content)}
                        >
                          <Sparkles className="h-3 w-3 mr-1" /> 
                          Analyze
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="p-2 border-t border-[#323236]">
              <form onSubmit={handleConsoleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  placeholder="Execute JavaScript..."
                  className="h-8 text-[12px] bg-[#262628] border-[#323236] focus-visible:ring-1 focus-visible:ring-[#4f4f52] focus-visible:ring-offset-0 text-white placeholder:text-[#808085]"
                />
                <Button 
                  type="submit" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-[11px] bg-[#262628] border-[#323236] text-white hover:bg-[#323236] hover:text-white"
                >
                  Run
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* Network Tab Content */}
        <TabsContent value="network" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-2 py-1 border-b border-[#323236] bg-[#1d1d1f]">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] text-[#bbbbbd] hover:text-white hover:bg-[#323236]"
                  onClick={() => setNetworkRequests([])}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Clear
                </Button>
              </div>
              
              <div className="relative w-[200px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#808085]" />
                <Input
                  type="text"
                  placeholder="Filter requests..."
                  className="h-7 pl-8 text-[11px] bg-[#262628] border-[#323236] focus-visible:ring-1 focus-visible:ring-[#4f4f52] focus-visible:ring-offset-0 text-white placeholder:text-[#808085] rounded"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {networkRequests.length === 0 ? (
                <div className="p-3 text-center text-[#808085] text-[12px]">
                  No network requests recorded
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {networkRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className={`p-2.5 rounded-md ${
                        request.status >= 400 ? 'bg-red-500/5 border border-red-500/20' : 
                        request.status >= 300 ? 'bg-amber-500/5 border border-amber-500/20' : 
                        'bg-[#1d1d1f] border border-[#323236]'
                      } group hover:bg-[#262628]`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            request.method === "GET" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : 
                            request.method === "POST" ? "bg-green-500/20 text-green-400 border border-green-500/30" : 
                            request.method === "PUT" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : 
                            "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          }`}>
                            {request.method}
                          </span>
                          <span className="text-[11px] text-white font-medium truncate max-w-[200px]">
                            {request.url}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            request.status >= 400 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            request.status >= 300 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                            'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {request.status}
                          </span>
                          <span className="text-[10px] text-[#bbbbbd]">{request.duration}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#808085]">{request.timestamp}</span>
                          <span className="text-[10px] text-[#808085]">{request.type}</span>
                          <span className="text-[10px] text-[#808085]">{request.size}</span>
                        </div>
                        
                        {request.status >= 400 && (
                          <button 
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 text-[10px] text-blue-400"
                            onClick={() => analyzeNetworkError(request)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> 
                            Fix Error
                          </button>
                        )}
                      </div>
                      
                      {/* Simple request details - expandable in a real implementation */}
                      {request.status >= 400 && (
                        <div className="mt-2 p-2 bg-[#1a1a1c] rounded border border-[#323236] text-[11px] text-red-400">
                          Error: {request.status === 404 ? "Resource not found" : "Server error"}
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
        <TabsContent value="performance" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full">
            {/* Left Panel - Interaction History */}
            <div className="w-[30%] border-r border-[#323236]">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#323236] bg-[#1d1d1f]">
                <span className="text-[11px] font-medium text-white">Interactions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-[#bbbbbd] hover:text-white hover:bg-[#323236] rounded-md"
                >
                  <Video className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100%-32px)]">
                <div className="space-y-0">
                  {performanceData.interactions.map((interaction) => (
                    <div 
                      key={interaction.id} 
                      className="px-3 py-2 border-b border-[#323236] hover:bg-[#262628] cursor-pointer flex items-center"
                    >
                      <div className="mr-2.5 h-4 w-4 flex items-center justify-center">
                        {interaction.type === "click" && <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>}
                        {interaction.type === "input" && <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>}
                        {interaction.type === "hover" && <div className="w-2.5 h-2.5 rounded-full bg-purple-400"></div>}
                        {interaction.type === "scroll" && <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-white">{interaction.target}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            parseInt(interaction.duration) > 50 ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                            parseInt(interaction.duration) > 20 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                            "bg-green-500/10 text-green-400 border border-green-500/20"
                          }`}>
                            {interaction.duration}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-[#808085]">{interaction.type}</span>
                          <span className="text-[10px] text-[#808085]">{interaction.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Right Panel - Component Renders Ranking */}
            <div className="flex-1">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#323236] bg-[#1d1d1f]">
                <span className="text-[11px] font-medium text-white">Ranked Components</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#bbbbbd]">Sort by:</span>
                  <select className="h-6 text-[10px] bg-[#262628] border-[#323236] focus-visible:ring-1 focus-visible:ring-[#4f4f52] focus-visible:ring-offset-0 text-white rounded px-2">
                    <option>Renders</option>
                    <option>Total Time</option>
                    <option>Avg Time</option>
                  </select>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100%-32px)]">
                <div className="p-2 space-y-1.5">
                  {performanceData.components.map((component, index) => (
                    <div 
                      key={index} 
                      className="rounded-md p-2.5 bg-[#1d1d1f] border border-[#323236] hover:bg-[#262628] group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-white">{component.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#262628] text-[#bbbbbd] border border-[#323236]">
                            x{component.renders}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#bbbbbd]">
                          {component.totalTime}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-[10px] text-[#bbbbbd] flex justify-between mb-1">
                          <span>Render time (avg: {component.avgTime})</span>
                        </div>
                        <div className="w-full bg-[#262628] h-1.5 rounded-full">
                          <div 
                            className={`${
                              parseFloat(component.avgTime) > 1.5 ? "bg-red-500" : 
                              parseFloat(component.avgTime) > 0.5 ? "bg-amber-500" : 
                              "bg-green-500"
                            } h-1.5 rounded-full`}
                            style={{width: `${Math.min(parseFloat(component.avgTime) * 50, 100)}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-[10px] text-right">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
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