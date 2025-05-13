"use client";

import { id } from "effect/Fiber";
import { useRouter } from "next/navigation";
import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { trpc } from "src/lib/trpc";
import { cn, iife } from "src/lib/utils";
import { TopBar } from "../[workspaceId]/workspace-top-bar";

const chartData = Array.from({ length: 20 }, (_, i) => ({
  name: i.toString(),
  value: Math.floor(Math.random() * 100),
}));

const devTools = [
  { id: "1", name: "Console", color: "#4f46e5", uiType: "console" },
  { id: "2", name: "Elements", color: "#10b981", uiType: "elements" },
  { id: "3", name: "Network", color: "#f59e0b", uiType: "network" },
  { id: "4", name: "Sources", color: "#ec4899", uiType: "sources" },
  { id: "5", name: "Performance", color: "#6366f1", uiType: "performance" },
  { id: "6", name: "Memory", color: "#8b5cf6", uiType: "memory" },
  { id: "7", name: "Application", color: "#ef4444", uiType: "application" },
  { id: "8", name: "Security", color: "#06b6d4", uiType: "security" },
  { id: "9", name: "Lighthouse", color: "#14b8a6", uiType: "lighthouse" },
  { id: "10", name: "Coverage", color: "#f97316", uiType: "coverage" },
  {
    id: "11",
    name: "Accessibility",
    color: "#64748b",
    uiType: "accessibility",
  },
  { id: "12", name: "React Profiler", color: "#a855f7", uiType: "react" },
  { id: "13", name: "Redux", color: "#0ea5e9", uiType: "redux" },
  { id: "14", name: "GraphQL", color: "#eab308", uiType: "graphql" },
  { id: "15", name: "Apollo", color: "#84cc16", uiType: "apollo" },
  { id: "16", name: "MobX", color: "#ec4899", uiType: "mobx" },
  { id: "17", name: "Vue Devtools", color: "#3b82f6", uiType: "vue" },
  { id: "18", name: "Svelte Inspector", color: "#22c55e", uiType: "svelte" },
  { id: "19", name: "Network Throttle", color: "#f43f5e", uiType: "throttle" },
  { id: "20", name: "Request Logger", color: "#d946ef", uiType: "logger" },
];

const enhancedDevTools = devTools.map((tool) => ({
  ...tool,
  height:
    Math.random() > 0.5 ? (Math.random() > 0.5 ? "300px" : "380px") : "260px",
}));

type ToolUIProps = {
  tool: { uiType: string; color: string; name: string; onClick: () => void };
};
const ToolUI = ({ tool }: ToolUIProps) => {
  const panelStyle = {
    background: "linear-gradient(135deg, #0a0a0a, #101010)",
    boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.03)",
  };

  const sectionStyle = {
    background: "linear-gradient(135deg, #121212, #151515)",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
  };

  const toolUi = iife(() => {
    switch (tool.uiType) {
      case "redux": {
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Redux DevTools</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 overflow-auto p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-xs text-zinc-400">SET_USER</span>
                <span className="text-[10px] px-1 rounded bg-blue-400/20 text-blue-400">
                  @12:42:01
                </span>
              </div>
              <div className="pl-4 text-xs font-mono">
                <span className="text-zinc-500">state: </span>
                <span className="text-green-400">{"{"}</span>
                <div className="pl-4">
                  <span className="text-blue-300">user: </span>
                  <span className="text-amber-300">{"{"}</span>
                  <div className="pl-4">
                    <span className="text-blue-300">id: </span>
                    <span className="text-green-400">42</span>,
                    <br />
                    <span className="text-blue-300">name: </span>
                    <span className="text-amber-300">"John Doe"</span>
                  </div>
                  <span className="text-amber-300">{"}"}</span>
                </div>
                <span className="text-green-400">{"}"}</span>
              </div>
            </div>
          </div>
        );
      }
      case "mobx": {
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">MobX DevTools</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 overflow-auto p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-xs text-zinc-400">todoStore</span>
                <span className="text-[10px] px-1 rounded bg-purple-400/20 text-purple-400">
                  observable
                </span>
              </div>
              <div className="pl-4 text-xs font-mono">
                <span className="text-zinc-500">state: </span>
                <span className="text-purple-400">{"{"}</span>
                <div className="pl-4">
                  <span className="text-blue-300">todos: </span>
                  <span className="text-amber-300">{"["}</span>
                  <div className="pl-4">
                    <span className="text-amber-300">{"{"}</span>
                    <div className="pl-4">
                      <span className="text-blue-300">id: </span>
                      <span className="text-green-400">1</span>,
                      <br />
                      <span className="text-blue-300">text: </span>
                      <span className="text-amber-300">"Buy milk"</span>,
                      <br />
                      <span className="text-blue-300">completed: </span>
                      <span className="text-red-400">false</span>
                    </div>
                    <span className="text-amber-300">{"}"}</span>
                  </div>
                  <span className="text-amber-300">{"]"}</span>
                </div>
                <span className="text-purple-400">{"}"}</span>
              </div>
            </div>
          </div>
        );
      }
      case "console":
        return (
          <div
            className="h-full flex flex-col text-xs font-mono text-green-400 p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Console</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div className="text-zinc-500">
              &gt; console.log(
              <span className="text-amber-300">'Hello world!'</span>)
            </div>
            <div className="text-green-400">Hello world!</div>
            <div className="text-zinc-500">&gt; 2 + 2</div>
            <div className="text-green-400">4</div>
          </div>
        );
      case "elements":
        return (
          <div
            className="h-full text-xs font-mono p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Elements</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div className="text-zinc-500">&lt;html&gt;</div>
            <div className="pl-2 text-zinc-500">&lt;body&gt;</div>
            <div className="pl-4 text-blue-400">
              &lt;div <span className="text-pink-400">class="container"</span>
              &gt;
            </div>
            <div className="pl-6 text-gray-300">Hello</div>
            <div className="pl-4 text-blue-400">&lt;/div&gt;</div>
            <div className="pl-2 text-zinc-500">&lt;/body&gt;</div>
            <div className="text-zinc-500">&lt;/html&gt;</div>
          </div>
        );
      case "network":
        return (
          <div
            className="h-full text-xs font-mono p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Network</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="rounded-sm mb-2 overflow-hidden border border-border/20"
              style={sectionStyle}
            >
              <div className="flex border-b border-border/20 py-1 px-2 text-zinc-400">
                <div className="w-1/2">Name</div>
                <div className="w-1/2">Status</div>
              </div>
              <div className="flex py-1 px-2">
                <div className="w-1/2 text-blue-400">main.js</div>
                <div className="w-1/2 text-green-400">200</div>
              </div>
              <div className="flex py-1 px-2">
                <div className="w-1/2 text-blue-400">api/data</div>
                <div className="w-1/2 text-green-400">200</div>
              </div>
              <div className="flex py-1 px-2">
                <div className="w-1/2 text-blue-400">favicon.ico</div>
                <div className="w-1/2 text-yellow-400">304</div>
              </div>
            </div>
          </div>
        );
      case "sources":
        return (
          <div
            className="h-full text-xs font-mono p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Sources</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div className="text-zinc-500 mb-1">/src/components/Tool.tsx</div>
            <div
              className="p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="text-[#569cd6]">export</div>{" "}
              <span className="text-[#dcdcaa]">function</span>{" "}
              <span className="text-[#9cdcfe]">Tool</span>() &#123;
              <div className="pl-2">
                <span className="text-[#c586c0]">return</span> &lt;div&gt;Tool
                UI&lt;/div&gt;;
              </div>
              &#125;
            </div>
          </div>
        );
      case "performance":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Performance</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 w-full h-20 p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={tool.color}
                    fillOpacity={0.2}
                    fill={tool.color}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case "memory":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Memory</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div
                className="w-16 h-16 rounded-full border-4 border-green-400/70 flex items-center justify-center text-green-400 text-lg"
                style={{
                  boxShadow: "0 0 10px rgba(74, 222, 128, 0.2)",
                  background:
                    "linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(22, 163, 74, 0.05))",
                }}
              >
                1.2GB
              </div>
              <div className="text-xs text-zinc-400 mt-2">Heap Used</div>
            </div>
          </div>
        );
      case "application":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Local Storage</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 flex flex-col gap-1 p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex justify-between text-xs py-1 border-b border-border/10">
                <span className="text-zinc-400">theme</span>
                <span className="text-blue-400">dark</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-zinc-400">token</span>
                <span className="text-green-400">••••••••</span>
              </div>
            </div>
          </div>
        );
      case "security":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Security</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 flex flex-col gap-1 p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> HTTPS
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> CSP
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">!</span> SRI
              </div>
            </div>
          </div>
        );
      case "lighthouse":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Lighthouse</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 flex flex-col gap-1 p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex justify-between py-1 border-b border-border/10">
                <span className="text-green-400">Performance</span>
                <span>98</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/10">
                <span className="text-green-400">Accessibility</span>
                <span>100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/10">
                <span className="text-yellow-400">Best Practices</span>
                <span>92</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-blue-400">SEO</span>
                <span>90</span>
              </div>
            </div>
          </div>
        );
      case "coverage":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Coverage</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 flex flex-col gap-1 p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex justify-between items-center py-1 border-b border-border/10">
                <span className="text-green-400">main.js</span>
                <div className="bg-zinc-800 w-24 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: "95%" }}
                  ></div>
                </div>
                <span>95%</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-yellow-400">vendor.js</span>
                <div className="bg-zinc-800 w-24 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full"
                    style={{ width: "78%" }}
                  ></div>
                </div>
                <span>78%</span>
              </div>
            </div>
          </div>
        );
      case "accessibility":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Accessibility</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 flex flex-col gap-1 p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Contrast
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Alt Text
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">!</span> ARIA
              </div>
            </div>
          </div>
        );
      case "graphql":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">GraphQL</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="text-zinc-500 text-[10px] mb-1">Query</div>
              <div
                className="p-2 mb-2 rounded-sm text-[10px] font-mono border border-border/20"
                style={sectionStyle}
              >{`{
  user(id: 1) {
    id
    name
  }
}`}</div>
              <div className="text-zinc-500 text-[10px] mb-1">Response</div>
              <div
                className="p-2 rounded-sm text-[10px] font-mono border border-border/20"
                style={sectionStyle}
              >{`{
  "id": 1,
  "name": "robby"
}`}</div>
            </div>
          </div>
        );
      case "apollo":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Apollo Cache</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 overflow-auto p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="p-1 mb-1 rounded-sm border border-border/10">
                ROOT_QUERY ➜ <span className="text-green-400">user:1</span>
              </div>
              <div className="p-1 rounded-sm border border-border/10">
                user:1 ➜ name: <span className="text-yellow-300">robby</span>
              </div>
            </div>
          </div>
        );
      case "react":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">React Profiler</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "conic-gradient(#61dafb 0% 20%, rgba(97, 218, 251, 0.5) 20% 100%)",
                  boxShadow: "0 0 15px rgba(97, 218, 251, 0.2)",
                }}
              >
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-[#61dafb]">
                  16ms
                </div>
              </div>
              <div className="text-zinc-400 text-xs mt-2">Render time</div>
            </div>
          </div>
        );
      case "vue":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Vue Devtools</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 overflow-auto p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <ul className="list-none text-[10px]">
                <li className="flex items-center py-1 border-b border-border/10">
                  <div className="w-3 h-3 bg-[#42b883] mr-2"></div>
                  <span>&lt;App&gt;</span>
                </li>
                <li className="flex items-center py-1 pl-3 border-b border-border/10">
                  <div className="w-3 h-3 bg-[#42b883]/70 mr-2"></div>
                  <span>&lt;Navbar&gt;</span>
                </li>
                <li className="flex items-center py-1 pl-6 border-b border-border/10">
                  <div className="w-3 h-3 bg-[#42b883]/50 mr-2"></div>
                  <span>&lt;Logo&gt;</span>
                </li>
                <li className="flex items-center py-1 pl-3">
                  <div className="w-3 h-3 bg-[#42b883]/70 mr-2"></div>
                  <span>&lt;Main&gt;</span>
                </li>
              </ul>
            </div>
          </div>
        );
      case "svelte":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Svelte Inspector</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div
                className="w-16 h-16 flex items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 62, 0, 0.1), rgba(255, 62, 0, 0.05))",
                  boxShadow: "0 0 10px rgba(255, 62, 0, 0.2)",
                  border: "2px solid rgba(255, 62, 0, 0.3)",
                }}
              >
                <span className="text-[#FF3E00] text-sm">Svelte</span>
              </div>
            </div>
          </div>
        );
      case "throttle":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Network Throttle</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 flex flex-col items-center justify-center gap-2 p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: "50%" }}
                ></div>
              </div>
              <div className="flex justify-between w-full text-[10px] text-zinc-400">
                <span>Slow 3G</span>
                <span>1,000 kb/s</span>
                <span>Fast 4G</span>
              </div>
            </div>
          </div>
        );
      case "logger":
        return (
          <div
            className="h-full flex flex-col p-3 rounded-sm border border-border/30 overflow-hidden"
            style={panelStyle}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border/20 pb-1">
              <span className="text-zinc-400">Request Logger</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
            </div>
            <div
              className="flex-1 overflow-auto p-2 rounded-sm border border-border/20"
              style={sectionStyle}
            >
              <div className="flex justify-between items-center py-1 border-b border-border/10">
                <span className="text-green-400">GET</span>
                <span className="text-xs text-zinc-500">/api/users</span>
                <span className="text-xs px-1 rounded bg-green-400/20 text-green-400">
                  200
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/10">
                <span className="text-blue-400">POST</span>
                <span className="text-xs text-zinc-500">/api/upload</span>
                <span className="text-xs px-1 rounded bg-blue-400/20 text-blue-400">
                  201
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-red-400">DELETE</span>
                <span className="text-xs text-zinc-500">/api/item/42</span>
                <span className="text-xs px-1 rounded bg-red-400/20 text-red-400">
                  403
                </span>
              </div>
            </div>
          </div>
        );
      default: {
        return null;
      }
    }
  });

  const el = toolUi
    ? React.cloneElement(toolUi, {
        onClick: tool.onClick,
      })
    : null;
  return el;
};

const MarketplaceLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn([
        "flex flex-col h-[100vh] w-[100vw] relative py-2",
        "bg-gradient-to-b from-[#080808cb] to-[#11111172]",
      ])}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
          backgroundSize: "32px 32px",
        }}
      />

      <TopBar />
      <div className="flex w-full justify-between">
        {children}
        {/* <Workspace workspace={workspace} />
          <WorkspaceChat /> */}
      </div>
      {/* <BottomBar/> */}
    </div>
  );
};

export default function MarketplacePage() {
  const [[projects, workspaces]] = trpc.useSuspenseQueries((t) => [
    t.daemon.getProjects(),
    t.workspace.getWorkspaces(),
  ]);

  const router = useRouter();
  return (
    <MarketplaceLayout>
      <div className="relative flex flex-col min-h-screen w-screen">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[#080808cb] to-[#11111172]"
          style={{
            backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="flex-1 p-6 pt-8">
          <div
            className="masonry-grid"
            style={{
              columnCount: 5,
              columnGap: "1rem",
              maxWidth: "1800px",
              margin: "0 auto",
            }}
          >
            {enhancedDevTools.map((tool) => (
              <div
                key={tool.id}
                className="mb-4 break-inside-avoid"
                style={{
                  display: "inline-block",
                  width: "100%",
                  height: tool.height,
                }}
              >
                <div
                  className="relative overflow-hidden rounded-sm border border-border/60 bg-background/20 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:translate-y-[-2px]"
                  style={{
                    height: "100%",
                    boxShadow: "0 4px 8px 1px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none z-10" />

                  <div className="h-full">
                    <ToolUI
                      tool={{
                        ...tool,
                        onClick: () => {
                          router.push(
                            `/editor/${workspaces[0].workspaceId}/${projects[0].name}`,
                          );
                        },
                      }}
                    />
                  </div>

                  <div
                    className="absolute bottom-2 left-2 right-2 px-3 py-1 backdrop-blur-sm bg-background/95 rounded-sm flex justify-between items-center z-20"
                    style={{
                      boxShadow:
                        "0 20px 30px -8px rgba(0,0,0,0.7), 0 10px 15px -5px rgba(0,0,0,0.3), inset 0 8px 25px rgba(0,0,0,0.8)",
                      background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
                    }}
                  >
                    <span className="font-medium text-xs text-zinc-100">
                      {tool.name}
                    </span>
                    <div
                      className="rounded-full w-2 h-2 ml-2"
                      style={{ backgroundColor: tool.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
