"use client";

import { Edit2Icon, ImageIcon, PlusCircleIcon } from "lucide-react";
import { Button } from "src/components/ui/button";
// import { pluginRPC } from "../rpc";
import { trpc } from "src/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { startTransition, useEffect, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "src/components/ui/context-menu";
import { Project } from "zenbu-daemon";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import AppSwitcher from "src/components/option-tab-switcher";
import Link from "next/link";
import { useUploadBackgroundImage } from "../[workspaceId]/hooks";
// import router from "next/router";

export default function Page() {
  const workspaceId = "packages";
  const uploadBackgroundImage = useUploadBackgroundImage();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const createProjectMutation = trpc.daemon.createProject.useMutation();
  const workspaces = [
    "home",
    "work",
    "games",
    "reproductions",
    "reusable",
    "os",
    "productivity",
    "devtools",
    "packages",
  ];

  const [items, setItems] = useState<string[]>([]);

  const [[workspace]] = trpc.useSuspenseQueries((t) => [
    t.workspace.getWorkspace({ workspaceId }),
  ]);

  return (
    <div
      style={{
        backgroundImage: workspace.backgroundImageUrl
          ? `url(${workspace.backgroundImageUrl})`
          : "",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="h-[100vh] w-[100vw] relative py-2"
    >
      <div className="flex items-center">
        <div className="flex bg-black rounded-lg w-fit mx-4">
          {workspaces.map((name) => (
            <Link
              key={name}
              href={`/${name}`}
              className={`inline-flex items-center text-sm justify-center rounded-none h-8 px-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
            >
              {name}
            </Link>
          ))}
        </div>
        <div className="flex bg-black rounded-lg w-fit ml-auto mr-2">
          <Link
            href={"/marketplace"}
            className={`inline-flex items-center text-sm justify-center rounded-none h-8 px-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
          >
            personal marketplace
          </Link>
          <Button
            onClick={async () => {
              uploadBackgroundImage.upload();
            }}
            className="inline-flex items-center text-sm justify-center rounded-none h-8 px-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            variant="ghost"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto">
        <div className="flex flex-wrap gap-12 px-4 overflow-y-auto h-">
          {[
            { name: "Messages", icon: "💬", color: "bg-green-500" },
            { name: "Calendar", icon: "📅", color: "bg-blue-500" },
            { name: "Photos", icon: "🖼️", color: "bg-purple-500" },
            { name: "Camera", icon: "📷", color: "bg-gray-500" },
            { name: "Maps", icon: "🗺️", color: "bg-red-500" },
            { name: "Clock", icon: "⏰", color: "bg-orange-500" },
            { name: "Weather", icon: "🌤️", color: "bg-cyan-500" },
            { name: "Notes", icon: "📝", color: "bg-yellow-500" },
            { name: "Reminders", icon: "✓", color: "bg-red-400" },
            { name: "Stocks", icon: "📈", color: "bg-black" },
            { name: "Books", icon: "📚", color: "bg-orange-400" },
            { name: "App Store", icon: "🔍", color: "bg-blue-400" },
            { name: "Health", icon: "❤️", color: "bg-pink-500" },
            { name: "Wallet", icon: "💳", color: "bg-indigo-500" },
            { name: "Settings", icon: "⚙️", color: "bg-gray-400" },
            { name: "Files", icon: "📁", color: "bg-blue-300" },
            { name: "Home", icon: "🏠", color: "bg-green-400" },
            { name: "Podcasts", icon: "🎙️", color: "bg-purple-400" },
            { name: "Music", icon: "🎵", color: "bg-pink-400" },
            { name: "Calculator", icon: "🧮", color: "bg-gray-600" },
            { name: "Browser", icon: "🌐", color: "bg-blue-600" },
            { name: "Mail", icon: "✉️", color: "bg-indigo-400" },
            { name: "Contacts", icon: "👥", color: "bg-yellow-600" },
            { name: "Terminal", icon: "💻", color: "bg-gray-800" },
            { name: "Games", icon: "🎮", color: "bg-purple-600" },
            { name: "Video", icon: "🎬", color: "bg-red-600" },
            { name: "Voice Memos", icon: "🎤", color: "bg-red-300" },
            { name: "Translate", icon: "🔄", color: "bg-teal-500" },
            { name: "Fitness", icon: "🏃", color: "bg-green-600" },
            { name: "News", icon: "📰", color: "bg-orange-600" },
            { name: "Passwords", icon: "🔑", color: "bg-gray-700" },
            { name: "Meditation", icon: "🧘", color: "bg-purple-300" },
            { name: "Finance", icon: "💰", color: "bg-emerald-500" },
            { name: "Travel", icon: "✈️", color: "bg-sky-500" },
            { name: "Food", icon: "🍔", color: "bg-amber-500" },
            { name: "Shopping", icon: "🛒", color: "bg-lime-500" },
            { name: "Social", icon: "👋", color: "bg-blue-700" },
            { name: "Analytics", icon: "📊", color: "bg-violet-500" },
            { name: "Security", icon: "🔒", color: "bg-slate-700" },
            { name: "Cloud", icon: "☁️", color: "bg-sky-400" },
            { name: "DevTools", icon: "🛠️", color: "bg-gray-500" },
            { name: "Debugger", icon: "🐞", color: "bg-red-500" },
            { name: "Inspector", icon: "🔍", color: "bg-blue-500" },
            { name: "Console", icon: "📟", color: "bg-black" },
            { name: "Network", icon: "📡", color: "bg-purple-500" },
            { name: "Performance", icon: "⚡", color: "bg-yellow-500" },
            { name: "Memory", icon: "🧠", color: "bg-green-500" },
            { name: "Storage", icon: "💾", color: "bg-blue-400" },
            { name: "Security", icon: "🔐", color: "bg-red-400" },
            { name: "Audits", icon: "📊", color: "bg-orange-500" },
            { name: "Sensors", icon: "📱", color: "bg-teal-500" },
            { name: "Rendering", icon: "🎨", color: "bg-pink-500" },
            { name: "Coverage", icon: "📝", color: "bg-indigo-500" },
            { name: "Animations", icon: "🎬", color: "bg-purple-400" },
            { name: "Layers", icon: "📚", color: "bg-blue-600" },
            { name: "Profiler", icon: "📈", color: "bg-green-600" },
            { name: "Accessibility", icon: "♿", color: "bg-blue-700" },
            { name: "Recorder", icon: "⏺️", color: "bg-red-600" },
            { name: "Issues", icon: "⚠️", color: "bg-amber-500" },
            { name: "Changes", icon: "📝", color: "bg-violet-500" },
            { name: "Breakpoints", icon: "🛑", color: "bg-red-700" },
            { name: "Snippets", icon: "✂️", color: "bg-blue-300" },
            { name: "Sources", icon: "📂", color: "bg-yellow-600" },
            { name: "Elements", icon: "🧩", color: "bg-emerald-500" },
            { name: "Timeline", icon: "⏱️", color: "bg-purple-600" },
            { name: "Lighthouse", icon: "🚦", color: "bg-orange-600" },
            { name: "Cookies", icon: "🍪", color: "bg-amber-400" },
            { name: "Frames", icon: "🖼️", color: "bg-indigo-400" },
            { name: "Emulation", icon: "📱", color: "bg-sky-500" },
            { name: "WebSockets", icon: "🔌", color: "bg-green-400" },
            { name: "DOM", icon: "🌳", color: "bg-lime-500" },
            { name: "CSS", icon: "🎨", color: "bg-pink-400" },
            { name: "JavaScript", icon: "📜", color: "bg-yellow-500" },
            { name: "Metrics", icon: "📏", color: "bg-cyan-500" },
            { name: "Requests", icon: "🔄", color: "bg-violet-400" },
            { name: "Throttling", icon: "🐢", color: "bg-gray-600" },
            { name: "Responsive", icon: "📱", color: "bg-blue-500" },
            { name: "Workspaces", icon: "🏢", color: "bg-slate-500" },
            { name: "Extensions", icon: "🧩", color: "bg-purple-500" },
            { name: "Settings", icon: "⚙️", color: "bg-gray-700" },
            { name: "Experiments", icon: "🧪", color: "bg-emerald-400" },
            { name: "Simulator", icon: "📲", color: "bg-sky-400" },
            { name: "Compiler", icon: "🔨", color: "bg-orange-500" },
            { name: "Formatter", icon: "✨", color: "bg-pink-500" },
            { name: "Linter", icon: "🧹", color: "bg-amber-600" },
            { name: "Bundler", icon: "📦", color: "bg-brown-500" },
            { name: "Minifier", icon: "🗜️", color: "bg-gray-800" },
            { name: "Transpiler", icon: "🔄", color: "bg-blue-600" },
            { name: "Analyzer", icon: "🔬", color: "bg-purple-700" },
            { name: "Validator", icon: "✅", color: "bg-green-500" },
            { name: "Debugger Pro", icon: "🔧", color: "bg-red-600" },
            { name: "Code Analyzer", icon: "🔍", color: "bg-blue-800" },
            { name: "Git Manager", icon: "🌿", color: "bg-orange-700" },
            { name: "Database Tool", icon: "🗄️", color: "bg-green-700" },
            { name: "API Tester", icon: "🔌", color: "bg-purple-800" },
            { name: "Cloud Deploy", icon: "☁️", color: "bg-sky-600" },
            { name: "Markdown Editor", icon: "📝", color: "bg-slate-600" },
            { name: "Color Picker", icon: "🎨", color: "bg-pink-600" },
            { name: "Image Editor", icon: "🖼️", color: "bg-indigo-600" },
            { name: "Terminal", icon: "💻", color: "bg-black" },
            { name: "File Explorer", icon: "📂", color: "bg-amber-700" },
            { name: "Regex Tester", icon: "🔣", color: "bg-violet-700" },
            { name: "JSON Formatter", icon: "📋", color: "bg-blue-500" },
            { name: "Code Snippets", icon: "✂️", color: "bg-teal-600" },
            { name: "Diff Viewer", icon: "⚖️", color: "bg-gray-600" },
            { name: "Task Runner", icon: "🏃", color: "bg-green-500" },
            { name: "Unit Tests", icon: "🧪", color: "bg-red-500" },
            { name: "Dependency Graph", icon: "🕸️", color: "bg-blue-700" },
            { name: "Code Coverage", icon: "📊", color: "bg-emerald-600" },
            { name: "Spell Checker", icon: "📚", color: "bg-amber-500" },
            { name: "Translator", icon: "🌐", color: "bg-sky-700" },
            { name: "Encryption Tool", icon: "🔒", color: "bg-gray-800" },
            { name: "Backup Manager", icon: "💾", color: "bg-blue-600" },
            { name: "Code Generator", icon: "⚡", color: "bg-yellow-600" },
            { name: "Diagram Maker", icon: "📐", color: "bg-purple-600" },
            { name: "Theme Builder", icon: "🎭", color: "bg-pink-700" },
            { name: "Keyboard Mapper", icon: "⌨️", color: "bg-slate-700" },
            { name: "Time Tracker", icon: "⏱️", color: "bg-orange-600" },
            { name: "Collaboration", icon: "👥", color: "bg-blue-500" },
            { name: "Code Review", icon: "👁️", color: "bg-violet-600" },
            { name: "Refactoring", icon: "🔄", color: "bg-green-600" },
            { name: "Bookmarks", icon: "🔖", color: "bg-amber-600" },
            { name: "Notifications", icon: "🔔", color: "bg-red-400" },
            { name: "Search Tool", icon: "🔎", color: "bg-indigo-700" },
            { name: "Syntax Checker", icon: "✓", color: "bg-emerald-500" },
            { name: "Code Stats", icon: "📈", color: "bg-blue-600" },
            { name: "Whiteboard", icon: "🖌️", color: "bg-purple-500" },
            { name: "Kanban Board", icon: "📌", color: "bg-cyan-600" },
            { name: "Documentation", icon: "📖", color: "bg-slate-600" },
            { name: "AI Assistant", icon: "🤖", color: "bg-violet-500" },
          ].map((app) => (
            <div
              key={app.name}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`bg-zinc-900 w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl mb-3
                transform transition-all duration-300 hover:scale-110 group-hover:rotate-1
                backdrop-blur-md relative overflow-hidden`}
                style={{
                  boxShadow: `0 15px 25px -5px ${app.color}40, 0 8px 10px -6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.1)`,
                  background: `linear-gradient(135deg, #1a1a1a, #2a2a2a)`,
                  textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                  border: `2px solid ${app.color}30`,
                }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-transparent to-${app.color.replace("bg-", "")}/10 opacity-80 rounded-2xl`}
                ></div>
                <div
                  className={`relative z-10 transform group-hover:scale-110 transition-transform duration-300 ${app.color.replace("bg-", "text-")}`}
                >
                  {app.icon}
                </div>
              </div>
              <span className="text-sm text-center font-semibold opacity-85 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-sm">
                {app.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
