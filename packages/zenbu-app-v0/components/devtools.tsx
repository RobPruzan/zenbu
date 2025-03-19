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
  BarChart,
  Code,
  History,
  FileJson,
  FileCog,
  Database,
  ServerCrash,
  LayoutGrid,
  Braces,
  Sparkles,
  MessageSquare,
  Maximize
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function DevTools() {
  const { inspectorState, setInspectorState } = useInspectorStateContext();
  const { messages, setMessages, input, setInput } = useChatContext();
  const [activeTab, setActiveTab] = useState("elements");
  const [consoleHistory, setConsoleHistory] = useState([
    { type: "info", content: "DevTools console initialized" },
    { type: "log", content: 'document.querySelector("h1").innerText' },
    { type: "result", content: '"Welcome to the Demo Website"' },
    { type: "warning", content: "Resource interpreted as Script but transferred with MIME type text/plain" },
    { type: "error", content: "Failed to load resource: net::ERR_CONNECTION_REFUSED" }
  ]);
  const [networkRequests, setNetworkRequests] = useState([
    { method: "GET", url: "/", status: 200, type: "document", size: "2.3 KB", time: "45 ms" },
    { method: "GET", url: "/styles.css", status: 304, type: "stylesheet", size: "1.5 KB", time: "12 ms" },
    { method: "GET", url: "/script.js", status: 200, type: "script", size: "856 B", time: "24 ms" },
    { method: "GET", url: "https://placekitten.com/600/300", status: 200, type: "image", size: "32.4 KB", time: "156 ms" },
    { method: "POST", url: "/api/contact", status: 404, type: "xhr", size: "0 B", time: "10 ms" }
  ]);
  const [consoleInput, setConsoleInput] = useState("");

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    setConsoleHistory(prev => [
      ...prev,
      { type: "log", content: consoleInput },
      { type: "result", content: `"Result of ${consoleInput} would appear here"` }
    ]);
    setConsoleInput("");
  };

  const toggleInspector = () => {
    setInspectorState(prev => ({
      kind: prev.kind === "inspecting" ? "off" : "inspecting",
    }));
  };

  const handleAnalyzeElement = () => {
    if (inspectorState.kind === "focused") {
      const prompt = `Analyze this HTML element: <${inspectorState.focusedInfo.name} ${
        inspectorState.focusedInfo.id ? `id="${inspectorState.focusedInfo.id}"` : ''
      } ${
        inspectorState.focusedInfo.className ? `class="${inspectorState.focusedInfo.className}"` : ''
      }>${inspectorState.focusedInfo.textContent || ''}</${inspectorState.focusedInfo.name}>`;
      
      setInput(prompt);
    }
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

      {/* DevTools Tabs */}
      <Tabs defaultValue="elements" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col relative z-10">
        <TabsList className="p-0 h-8 bg-[#1a1a1c]/70 backdrop-blur-xl border-b border-[#2a2a2c] justify-start rounded-none">
          <TabsTrigger 
            value="elements" 
            className="rounded-none py-1.5 px-3 h-8 text-[10px] font-medium data-[state=active]:bg-[#232326]/60 data-[state=active]:text-[#e0e0e3] data-[state=active]:shadow-none text-[#a0a0a5]"
          >
            <Inspect className="h-3 w-3 mr-1.5" />
            Elements
          </TabsTrigger>
          <TabsTrigger 
            value="console" 
            className="rounded-none py-1.5 px-3 h-8 text-[10px] font-medium data-[state=active]:bg-[#232326]/60 data-[state=active]:text-[#e0e0e3] data-[state=active]:shadow-none text-[#a0a0a5]"
          >
            <Terminal className="h-3 w-3 mr-1.5" />
            Console
          </TabsTrigger>
          <TabsTrigger 
            value="network" 
            className="rounded-none py-1.5 px-3 h-8 text-[10px] font-medium data-[state=active]:bg-[#232326]/60 data-[state=active]:text-[#e0e0e3] data-[state=active]:shadow-none text-[#a0a0a5]"
          >
            <Network className="h-3 w-3 mr-1.5" />
            Network
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="rounded-none py-1.5 px-3 h-8 text-[10px] font-medium data-[state=active]:bg-[#232326]/60 data-[state=active]:text-[#e0e0e3] data-[state=active]:shadow-none text-[#a0a0a5]"
          >
            <BarChart className="h-3 w-3 mr-1.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="application" 
            className="rounded-none py-1.5 px-3 h-8 text-[10px] font-medium data-[state=active]:bg-[#232326]/60 data-[state=active]:text-[#e0e0e3] data-[state=active]:shadow-none text-[#a0a0a5]"
          >
            <Database className="h-3 w-3 mr-1.5" />
            Storage
          </TabsTrigger>
          <div className="ml-auto flex items-center h-8 px-2">
            <span className="text-[9px] text-[#808085] mr-2">AI Developer Tools</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-[#a0a0a5] hover:text-[#e0e0e3] rounded-full"
            >
              <Sparkles className="h-3 w-3" />
            </Button>
          </div>
        </TabsList>

        {/* Elements Tab */}
        <TabsContent value="elements" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-1 px-2 py-1 border-b border-[#2a2a2c] bg-[#1e1e20]/30 backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-[10px] ${inspectorState.kind === "inspecting" ? "bg-[#949bf8]/10 text-[#949bf8]" : "text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"}`}
                onClick={toggleInspector}
              >
                <Inspect className="h-3 w-3 mr-1.5" />
                {inspectorState.kind === "inspecting" ? "Stop Inspecting" : "Inspect Element"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
                onClick={handleAnalyzeElement}
              >
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Explain Element
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 font-mono text-[11px]">
                {inspectorState.kind === "focused" ? (
                  <div>
                    <div className="mb-2 text-[#e0e0e3]">
                      <span className="text-blue-400">&lt;</span>
                      <span className="text-emerald-400">{inspectorState.focusedInfo.name}</span>
                      {inspectorState.focusedInfo.id && (
                        <span>
                          <span className="text-amber-400"> id</span>
                          <span className="text-blue-400">=</span>
                          <span className="text-red-400">"{inspectorState.focusedInfo.id}"</span>
                        </span>
                      )}
                      {inspectorState.focusedInfo.className && (
                        <span>
                          <span className="text-amber-400"> class</span>
                          <span className="text-blue-400">=</span>
                          <span className="text-red-400">"{inspectorState.focusedInfo.className}"</span>
                        </span>
                      )}
                      <span className="text-blue-400">&gt;</span>
                    </div>
                    <div className="pl-4 mb-2 text-[#a0a0a5] break-words whitespace-pre-wrap">
                      {inspectorState.focusedInfo.textContent || "<no content>"}
                    </div>
                    <div>
                      <span className="text-blue-400">&lt;/</span>
                      <span className="text-emerald-400">{inspectorState.focusedInfo.name}</span>
                      <span className="text-blue-400">&gt;</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#a0a0a5]">
                    <p>Click "Inspect Element" and then click on an element in the page to inspect it.</p>
                    <p className="mt-2">You can also ask AI to explain the element properties and suggest improvements.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Console Tab */}
        <TabsContent value="console" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-1 px-2 py-1 border-b border-[#2a2a2c] bg-[#1e1e20]/30 backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <History className="h-3 w-3 mr-1.5" />
                Clear Console
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Explain Error
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1 font-mono text-[11px]">
                {consoleHistory.map((entry, index) => (
                  <div key={index} className={`p-1.5 border-b border-[#2a2a2c]/40 ${entry.type === 'error' ? 'text-red-400' : entry.type === 'warning' ? 'text-amber-400' : entry.type === 'result' ? 'text-blue-400' : 'text-[#e0e0e3]'} break-words whitespace-pre-wrap overflow-hidden`}>
                    {entry.type === 'log' && <span className="text-[#808085] mr-2">&gt;</span>}
                    {entry.type === 'result' && <span className="text-[#808085] mr-2">&lt;</span>}
                    {entry.type === 'error' && <span className="text-[#808085] mr-2">✖</span>}
                    {entry.type === 'warning' && <span className="text-[#808085] mr-2">⚠</span>}
                    {entry.type === 'info' && <span className="text-[#808085] mr-2">ℹ</span>}
                    {entry.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-[#2a2a2c]">
              <form onSubmit={handleConsoleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  placeholder="Enter JavaScript..."
                  className="h-7 text-[11px] bg-[#1e1e1e] border-[#333333] focus-visible:ring-0 focus-visible:ring-offset-0 text-[#e0e0e3] placeholder:text-[#808085]"
                />
                <Button 
                  type="submit" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 text-[10px] bg-[#232326]/60 border-[#323236] text-[#e0e0e3] hover:bg-[#323236] hover:text-[#e0e0e3]"
                >
                  Run
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-1 px-2 py-1 border-b border-[#2a2a2c] bg-[#1e1e20]/30 backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <History className="h-3 w-3 mr-1.5" />
                Clear Network
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <ServerCrash className="h-3 w-3 mr-1.5" />
                Block Requests
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[9px] text-[#808085] bg-[#1e1e20]/30">
                    <th className="px-2 py-1 font-medium text-left border-b border-[#2a2a2c]/80">Name</th>
                    <th className="px-2 py-1 font-medium text-left border-b border-[#2a2a2c]/80">Status</th>
                    <th className="px-2 py-1 font-medium text-left border-b border-[#2a2a2c]/80">Type</th>
                    <th className="px-2 py-1 font-medium text-left border-b border-[#2a2a2c]/80">Size</th>
                    <th className="px-2 py-1 font-medium text-left border-b border-[#2a2a2c]/80">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {networkRequests.map((request, index) => (
                    <tr key={index} className="text-[10px] hover:bg-[#1e1e20]/40">
                      <td className="px-2 py-1 border-b border-[#2a2a2c]/20">
                        <div className="flex items-center">
                          <span className={`mr-1.5 ${
                            request.method === "GET" ? "text-emerald-400" : 
                            request.method === "POST" ? "text-blue-400" : 
                            request.method === "PUT" ? "text-amber-400" : 
                            "text-red-400"
                          }`}>{request.method}</span>
                          <span className="text-[#e0e0e3] truncate max-w-[180px] overflow-hidden text-ellipsis">{request.url}</span>
                        </div>
                      </td>
                      <td className={`px-2 py-1 border-b border-[#2a2a2c]/20 ${
                        request.status >= 200 && request.status < 300 ? "text-emerald-400" :
                        request.status >= 300 && request.status < 400 ? "text-blue-400" :
                        request.status >= 400 && request.status < 500 ? "text-amber-400" :
                        "text-red-400"
                      }`}>
                        {request.status}
                      </td>
                      <td className="px-2 py-1 border-b border-[#2a2a2c]/20 text-[#a0a0a5]">{request.type}</td>
                      <td className="px-2 py-1 border-b border-[#2a2a2c]/20 text-[#a0a0a5]">{request.size}</td>
                      <td className="px-2 py-1 border-b border-[#2a2a2c]/20 text-[#a0a0a5]">{request.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-1 px-2 py-1 border-b border-[#2a2a2c] bg-[#1e1e20]/30 backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <BarChart className="h-3 w-3 mr-1.5" />
                Record Performance
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Analyze Performance
              </Button>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-medium text-[#e0e0e3] mb-2">Memory Usage</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between mb-1 text-[9px]">
                      <span className="text-[#a0a0a5]">Used Memory</span>
                      <span className="text-emerald-400">128MB</span>
                    </div>
                    <div className="w-full bg-[#232326] h-1.5 rounded-full">
                      <div className="bg-emerald-500 h-1.5 rounded-full w-1/4"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-medium text-[#e0e0e3] mb-2">CPU Usage</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between mb-1 text-[9px]">
                      <span className="text-[#a0a0a5]">Main Thread</span>
                      <span className="text-amber-400">42%</span>
                    </div>
                    <div className="w-full bg-[#232326] h-1.5 rounded-full">
                      <div className="bg-amber-500 h-1.5 rounded-full w-2/5"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-medium text-[#e0e0e3] mb-2">Render Performance</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between mb-1 text-[9px]">
                      <span className="text-[#a0a0a5]">First Contentful Paint</span>
                      <span className="text-blue-400">356ms</span>
                    </div>
                    <div className="w-full bg-[#232326] h-1.5 rounded-full">
                      <div className="bg-blue-500 h-1.5 rounded-full w-3/5"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-medium text-[#e0e0e3] mb-2">Network Performance</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between mb-1 text-[9px]">
                      <span className="text-[#a0a0a5]">Average Response Time</span>
                      <span className="text-purple-400">156ms</span>
                    </div>
                    <div className="w-full bg-[#232326] h-1.5 rounded-full">
                      <div className="bg-purple-500 h-1.5 rounded-full w-1/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Application Tab */}
        <TabsContent value="application" className="flex-1 p-0 m-0 border-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-1 px-2 py-1 border-b border-[#2a2a2c] bg-[#1e1e20]/30 backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <Database className="h-3 w-3 mr-1.5" />
                Clear Storage
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-[#a0a0a5] hover:text-[#e0e0e3] hover:bg-[#323236]/40"
              >
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Analyze Data
              </Button>
            </div>
            <div className="flex flex-1">
              <div className="w-[180px] border-r border-[#2a2a2c]/80 p-0">
                <div className="text-[10px] text-[#808085] p-2 border-b border-[#2a2a2c]/40 bg-[#1e1e20]/30 backdrop-blur-md">
                  Storage
                </div>
                <div className="text-[10px]">
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#232326]/40 text-[#e0e0e3]">Local Storage</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#232326]/40 text-[#e0e0e3]">Session Storage</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#232326]/40 text-[#e0e0e3]">Cookies</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#232326]/40 text-[#e0e0e3]">IndexedDB</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#232326]/40 text-[#e0e0e3]">Web SQL</button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#232326]/40 text-[#e0e0e3]">Cache Storage</button>
                </div>
              </div>
              <div className="flex-1 p-3 font-mono text-[11px] text-[#a0a0a5]">
                <p>Select a storage type from the sidebar to view its contents.</p>
                <p className="mt-2">You can also ask AI to analyze stored data patterns and security implications.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 