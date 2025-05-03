"use client";

import {
  Share2,
  Grid,
  Calendar,
  Terminal,
  Copy,
  Settings,
  Mic,
  Send,
  Sliders,
  FileText,
  MessageSquare,
  PanelBottom,
  Pencil,
  Camera,
  Airplay,
  Inspect,
  Scan,
  Gauge,
  Activity,
  Logs,
  DownloadCloud,
  Component,
  Globe,
  Store,
  Zap,
  Folder,
  Plus,
  Image as ImageIcon,
  ChevronRight,
  Clock,
  Cpu,
  Command,
  Home,
  GitBranch,
  Package,
  Network,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ChatInstanceStore, useChatStore } from "./chat-store";
import { cn } from "src/lib/utils";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "src/lib/trpc";
import { IFrameWrapper } from "src/app/iframe-wrapper";
import { ScreenshotTool } from "src/app/screenshot-tool";
import { BetterToolbar } from "src/components/slices/better-toolbar";
import { DevtoolsOverlay } from "src/components/devtools-overlay";
import { BetterDrawing } from "src/app/better-drawing";
import { Recording } from "src/components/recording";

interface ProjectPreviewProps {
  name: string;
  port: number;
  status: string;
  x: number;
  y: number;
  scale?: number;
  isActive?: boolean;
  onSelect?: () => void;
}

const Widget = ({
  children,
  className,
  x,
  y,
  onPositionChange,
}: {
  children: React.ReactNode;
  className?: string;
  x: number;
  y: number;
  onPositionChange?: (x: number, y: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState({ width: 280, height: "auto" });
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = (
    e: React.MouseEvent,
    direction: "e" | "se" | "s" | "sw" | "w" | "nw" | "n" | "ne",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.pageX;
    const startY = e.pageY;
    const startWidth = size.width;
    const startHeight = typeof size.height === "number" ? size.height : 0;
    const startLeft = x;
    const startTop = y;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newY = startTop;

      if (direction.includes("e")) {
        newWidth = Math.max(180, startWidth + (e.pageX - startX));
      } else if (direction.includes("w")) {
        const diff = e.pageX - startX;
        newWidth = Math.max(180, startWidth - diff);
        newX = startLeft + diff;
      }

      if (direction.includes("s")) {
        newHeight = Math.max(100, startHeight + (e.pageY - startY));
      } else if (direction.includes("n")) {
        const diff = e.pageY - startY;
        newHeight = Math.max(100, startHeight - diff);
        newY = startTop + diff;
      }

      setSize({ width: newWidth, height: newHeight });
      if (direction.includes("w") || direction.includes("n")) {
        onPositionChange?.(newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <motion.div
      drag={!isResizing}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setTimeout(() => setIsDragging(false), 0);
        onPositionChange?.(x + info.offset.x, y + info.offset.y);
      }}
      className={cn(
        "absolute bg-black/90 backdrop-blur-sm rounded-lg overflow-hidden border border-white/[0.08]",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.5)]",
        isDragging && "z-50 cursor-grabbing ring-1 ring-white/20",
        !isDragging &&
          !isResizing &&
          "cursor-grab hover:ring-1 hover:ring-white/20 transition-all",
        className,
      )}
      style={{
        left: x,
        top: y,
        width: size.width,
        height: size.height,
        position: "absolute",
      }}
      initial={false}
      animate={{
        scale: isDragging ? 1.02 : 1,
        transition: { duration: 0.2 },
      }}
    >
      {children}

      {/* Resize handles */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
        <div
          className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />

        <div
          className="absolute top-2 left-0 bottom-2 w-1 cursor-w-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "w")}
        />
        <div
          className="absolute top-2 right-0 bottom-2 w-1 cursor-e-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        />
        <div
          className="absolute top-0 left-2 right-2 h-1 cursor-n-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "n")}
        />
        <div
          className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize pointer-events-auto hover:bg-white/5"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        />
      </div>
    </motion.div>
  );
};

// Update the widget content styles
const WidgetHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.06]">
    <h2 className="text-[11px] font-medium tracking-wide text-white/70 uppercase">
      {title}
    </h2>
    <div className="flex items-center gap-1">
      <div className="w-1 h-1 rounded-full bg-white/20" />
      <div className="w-1 h-1 rounded-full bg-white/20" />
      <div className="w-1 h-1 rounded-full bg-white/20" />
    </div>
  </div>
);

const MetricContainer = ({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-white/[0.02] px-3 py-2 border-t border-white/[0.06]",
      className,
    )}
  >
    <div className="text-sm font-medium text-white/90">{value}</div>
    <div className="text-[11px] font-medium text-white/40 uppercase tracking-wide">
      {label}
    </div>
  </div>
);

const ProgressBar = ({
  value,
  max = 100,
  color = "white",
}: {
  value: number;
  max?: number;
  color?: string;
}) => (
  <div className="h-1 bg-white/[0.06] overflow-hidden">
    <div
      className="h-full transition-all duration-500 ease-out"
      style={{
        width: `${(value / max) * 100}%`,
        backgroundColor: color,
        opacity: 0.4,
      }}
    />
  </div>
);

// Update the quick actions buttons style
const ActionButton = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <Button
    variant="outline"
    className="h-[42px] flex flex-col items-center justify-center gap-1 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
  >
    <Icon size={12} className="text-white/70" />
    <span className="text-[10px] font-medium text-white/50 uppercase tracking-wide">
      {label}
    </span>
  </Button>
);

const ProjectPreview = ({
  name,
  port,
  status,
  x,
  y,
  scale = 1,
  isActive,
  onSelect,
}: ProjectPreviewProps) => {
  const [size, setSize] = useState({ width: 320, height: 200 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const iframe = useChatStore((state) => state.iframe);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [previousSize, setPreviousSize] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized) return;

    if (!isExpanded) {
      setPreviousSize({ width: size.width, height: size.height, x, y });
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      setSize({
        width: viewportWidth * 0.92,
        height: viewportHeight * 0.92,
      });
      setDragPosition({ x: 0, y: 0 });
    } else {
      if (previousSize) {
        setSize({ width: previousSize.width, height: previousSize.height });
      }
      setDragPosition({ x: 0, y: 0 });
    }
    setIsExpanded(!isExpanded);
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMaximized) {
      setPreviousSize({ width: size.width, height: size.height, x, y });
      const margin = 8;
      const topMargin = 32;
      setSize({
        width: window.innerWidth - margin * 2,
        height: window.innerHeight - (margin + topMargin),
      });
      setDragPosition({
        x: margin - x,
        y: topMargin - y,
      });
    } else {
      if (previousSize) {
        setSize({ width: previousSize.width, height: previousSize.height });
      }
      setDragPosition({ x: 0, y: 0 });
      if (isExpanded) setIsExpanded(false);
    }
    setIsMaximized(!isMaximized);
  };

  // Calculate the target position for expanded state
  const expandedX = window.innerWidth / 2 - (window.innerWidth * 0.92) / 2;
  const expandedY = window.innerHeight / 2 - (window.innerHeight * 0.92) / 2;

  const handleResizeStart = (
    e: React.MouseEvent,
    direction: "e" | "se" | "s" | "sw" | "w" | "nw" | "n" | "ne",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.pageX;
    const startY = e.pageY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startLeft = x;
    const startTop = y;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newY = startTop;

      if (direction.includes("e")) {
        newWidth = Math.max(280, startWidth + (e.pageX - startX) / scale);
      } else if (direction.includes("w")) {
        const diff = (e.pageX - startX) / scale;
        newWidth = Math.max(280, startWidth - diff);
        newX = startLeft + diff;
      }

      if (direction.includes("s")) {
        newHeight = Math.max(160, startHeight + (e.pageY - startY) / scale);
      } else if (direction.includes("n")) {
        const diff = (e.pageY - startY) / scale;
        newHeight = Math.max(160, startHeight - diff);
        newY = startTop + diff;
      }

      setSize({ width: newWidth, height: newHeight });
      if (direction.includes("w") || direction.includes("n")) {
        onSelect?.();
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <motion.div
      drag={!isResizing}
      dragMomentum={false}
      dragConstraints={
        isExpanded || isMaximized
          ? {
              left: 0,
              top: 0,
              right: window.innerWidth - size.width,
              bottom: window.innerHeight - size.height,
            }
          : undefined
      }
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setTimeout(() => setIsDragging(false), 0);
        if (isExpanded || isMaximized) {
          setDragPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
          }));
        }
      }}
      className={cn(
        "absolute bg-black rounded-xl overflow-hidden shadow-lg border border-white/10",
        isActive && "ring-2 ring-white/50",
        isDragging && "cursor-grabbing",
        !isDragging && !isResizing && "cursor-grab",
        (isExpanded || isMaximized) && "z-50 shadow-2xl backdrop-blur-sm",
      )}
      initial={false}
      animate={{
        width: size.width,
        height: size.height,
        left: isMaximized
          ? x + dragPosition.x
          : isExpanded
            ? expandedX + dragPosition.x
            : x,
        top: isMaximized
          ? y + dragPosition.y
          : isExpanded
            ? expandedY + dragPosition.y
            : y,
        scale: scale,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      }}
      style={{
        zIndex: isExpanded || isMaximized ? 9999 : "auto",
      }}
      onClick={() => {
        if (isDragging || isResizing) return;
        if (status === "running") {
          iframe.actions.setInspectorState({
            url: `http://localhost:${port}`,
            project: { name, port, status },
          });
          onSelect?.();
          window.dispatchEvent(new CustomEvent("show-project-view"));
        }
      }}
    >
      <div className="flex flex-col h-full relative">
        {/* Control buttons absolutely positioned in top right */}
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          {status === "running" && (
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
          <button
            onClick={handleExpand}
            className={cn(
              "text-white/60 hover:text-white/90 transition-colors",
              isMaximized && "opacity-50 cursor-not-allowed",
            )}
            disabled={isMaximized}
          >
            {isExpanded ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={handleMaximize}
            className="text-white/60 hover:text-white/90 transition-colors"
          >
            {isMaximized ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex-1 bg-black">
          <iframe
            src={`http://localhost:${port}`}
            className="w-full h-full pointer-events-none"
            style={{
              transform: "scale(0.5)",
              transformOrigin: "top left",
              width: "200%",
              height: "200%",
            }}
          />
        </div>
      </div>

      {/* Only show resize handles when not expanded or maximized */}
      {!isExpanded && !isMaximized && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />

          <div
            className="absolute top-2 left-0 bottom-2 w-1 cursor-w-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="absolute top-2 right-0 bottom-2 w-1 cursor-e-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize pointer-events-auto hover:bg-white/5"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
        </div>
      )}
    </motion.div>
  );
};

interface Workspace {
  id: string;
  name: string;
  projects: {
    name: string;
    port: number;
    status: string;
    x: number;
    y: number;
  }[];
}

const AppSwitcher = ({
  isVisible,
  items,
  activeIndex,
  onSelect,
  onCancel,
}: {
  isVisible: boolean;
  items: Array<{
    name: string;
    port?: number;
    status?: string;
    isHome?: boolean;
  }>;
  activeIndex: number;
  onSelect: (item: {
    name: string;
    port?: number;
    status?: string;
    isHome?: boolean;
  }) => void;
  onCancel: () => void;
}) => {
  if (!isVisible || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="bg-black border border-white/20 rounded-xl p-4 pb-8 shadow-2xl">
        <div className="flex items-center gap-3">
          {items.map((item, index) => (
            <div
              key={item.name}
              className={cn(
                "relative flex flex-col items-center",
                index === activeIndex && "z-10",
              )}
            >
              <div
                className={cn(
                  "w-48 h-32 rounded-lg overflow-hidden border border-white/20 bg-black mb-3",
                  index === activeIndex && "ring-2 ring-white",
                )}
              >
                {item.isHome ? (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <Home className="w-12 h-12" />
                  </div>
                ) : (
                  <iframe
                    src={`http://localhost:${item.port}`}
                    className="w-full h-full pointer-events-none"
                    style={{
                      transform: "scale(0.25)",
                      transformOrigin: "top left",
                      width: "400%",
                      height: "400%",
                    }}
                  />
                )}
              </div>
              <div
                className={cn(
                  "text-xs whitespace-nowrap",
                  index === activeIndex ? "text-white" : "text-white/60",
                )}
              >
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("zenbu-background") || null;
    }
    return null;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const createProjectMutation = trpc.daemon.createProject.useMutation();

  // Workspace management
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zenbu-workspaces");
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return [
      {
        id: "home",
        name: "Home",
        projects: projects.map((p, i) => ({
          name: p.name,
          port: p.port,
          status: p.status,
          x: 300 + (i % 3) * 360,
          y: 120 + Math.floor(i / 3) * 240,
        })),
      },
      {
        id: "workspace-1",
        name: "Workspace 1",
        projects: [],
      },
    ];
  });

  const [openProjects, setOpenProjects] = useState<
    Record<
      string,
      {
        name: string;
        port: number;
        status: string;
        isExpanded: boolean;
        isMaximized: boolean;
        position: { x: number; y: number };
      }
    >
  >({});

  // Update workspaces effect to preserve open projects
  useEffect(() => {
    const updatedWorkspaces = workspaces.map((workspace) => ({
      ...workspace,
      projects: projects.map((p, i) => {
        const existingProject = workspace.projects.find(
          (wp) => wp.name === p.name,
        );
        const openProject = openProjects[`${workspace.id}-${p.name}`];
        return {
          name: p.name,
          port: p.port,
          status: p.status,
          x:
            openProject?.position.x ??
            existingProject?.x ??
            300 + (i % 3) * 360,
          y:
            openProject?.position.y ??
            existingProject?.y ??
            120 + Math.floor(i / 3) * 240,
        };
      }),
    }));
    setWorkspaces(updatedWorkspaces);
  }, [projects, openProjects]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zenbu-workspaces", JSON.stringify(workspaces));
    }
  }, [workspaces]);

  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  const [activeProjectIndex, setActiveProjectIndex] = useState<number>(-1);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);
  const runningProjects = activeWorkspace.projects.filter(
    (p) => p.status === "running",
  );
  const iframe = useChatStore((state) => state.iframe);

  const updateRecentlyUsed = (itemName: string) => {
    setRecentlyUsed((prev) => [
      itemName,
      ...prev.filter((name) => name !== itemName),
    ]);
  };

  const getSortedSwitcherItems = () => {
    const baseItems = [
      { name: "Home", isHome: true },
      ...runningProjects.map((p) => ({ ...p, isHome: false })),
    ];

    return baseItems.sort((a, b) => {
      const aIndex = recentlyUsed.indexOf(a.name);
      const bIndex = recentlyUsed.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAppSwitcher) {
        e.preventDefault();
        setShowAppSwitcher(false);
        return;
      }

      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        const items = getSortedSwitcherItems();

        if (!showAppSwitcher) {
          setShowAppSwitcher(true);
          setSwitcherIndex(1 % items.length);
        } else {
          setSwitcherIndex((prev) => (prev + 1) % items.length);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" && showAppSwitcher) {
        const items = getSortedSwitcherItems();
        const selectedItem = items[switcherIndex];

        if (selectedItem) {
          if (selectedItem.isHome) {
            setShowProjectView(false);
          } else {
            iframe.actions.setInspectorState({
              url: `http://localhost:${selectedItem.port}`,
              project: selectedItem,
            });
            setShowProjectView(true);
          }
          updateRecentlyUsed(selectedItem.name);
          setShowAppSwitcher(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [showAppSwitcher, switcherIndex, iframe.actions]);

  useEffect(() => {
    if (typeof window !== "undefined" && backgroundImage) {
      localStorage.setItem("zenbu-background", backgroundImage);
    }
  }, [backgroundImage]);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBackgroundImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProjectOpen = (project: {
    name: string;
    port: number;
    status: string;
  }) => {
    const projectKey = `${activeWorkspace.id}-${project.name}`;
    setOpenProjects((prev) => ({
      ...prev,
      [projectKey]: {
        ...project,
        isExpanded: false,
        isMaximized: false,
        position: {
          x: window.innerWidth / 2 - 160,
          y: window.innerHeight / 2 - 100,
        },
      },
    }));
    updateRecentlyUsed(project.name);
  };

  const [showProjectView, setShowProjectView] = useState(false);

  useEffect(() => {
    const handleShowProjectView = () => setShowProjectView(true);
    const handleHideProjectView = () => setShowProjectView(false);

    window.addEventListener("show-project-view", handleShowProjectView);
    window.addEventListener("hide-project-view", handleHideProjectView);

    return () => {
      window.removeEventListener("show-project-view", handleShowProjectView);
      window.removeEventListener("hide-project-view", handleHideProjectView);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
          backgroundColor: backgroundImage ? undefined : "rgb(0, 0, 0)",
        }}
      />

      {/* Background change button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute top-3 right-3 z-[9999] w-8 h-8 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-black/90 hover:border-white/20 transition-all"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleBackgroundUpload}
      />

      <div className="relative h-full">
        {showProjectView ? (
          <div className="h-full flex">
            <div className="flex-1 relative">
              <IFrameWrapper>
                <ScreenshotTool />
                <BetterToolbar />
                <DevtoolsOverlay />
                <BetterDrawing />
                <Recording />
              </IFrameWrapper>
            </div>
          </div>
        ) : (
          <>
            {/* Project Previews */}
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={cn(
                  "absolute inset-0",
                  workspace.id === activeWorkspace.id
                    ? "visible"
                    : "invisible pointer-events-none",
                )}
              >
                {workspace.projects.map((project, index) => (
                  <ProjectPreview
                    key={project.name}
                    {...project}
                    isActive={
                      workspace.id === activeWorkspace.id &&
                      index === activeProjectIndex
                    }
                    onSelect={() => {
                      setActiveProjectIndex(index);
                      handleProjectOpen(project);
                    }}
                    scale={
                      workspace.id === activeWorkspace.id &&
                      index === activeProjectIndex
                        ? 1
                        : 0.9
                    }
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {showAppSwitcher && (
        <AppSwitcher
          isVisible={showAppSwitcher}
          items={getSortedSwitcherItems()}
          activeIndex={switcherIndex}
          onSelect={(item) => {
            if (item.isHome) {
              setShowProjectView(false);
            } else {
              iframe.actions.setInspectorState({
                url: `http://localhost:${item.port}`,
                project: item,
              });
              setShowProjectView(true);
            }
            updateRecentlyUsed(item.name);
            setShowAppSwitcher(false);
          }}
          onCancel={() => setShowAppSwitcher(false)}
        />
      )}
    </div>
  );
};

export { HomePage };

interface SlimSidebarProps {
  className?: string;
}

export function SlimSidebar({ className }: SlimSidebarProps) {
  const { actions, state } = useChatStore((state) => state.toolbar);
  const inspector = useChatStore((state) => state.inspector);

  const handleHome = () => {
    window.dispatchEvent(new CustomEvent("toggle-home"));
  };

  const handleWebsiteTree = () => {
    window.dispatchEvent(
      new CustomEvent("toggle-website-tree", { detail: { position: "left" } }),
    );
  };

  const handleReactTree = () => {
    window.dispatchEvent(
      new CustomEvent("toggle-react-tree", { detail: { position: "left" } }),
    );
  };

  const handleChat = () => {
    window.dispatchEvent(
      new CustomEvent("toggle-chat", { detail: { position: "right" } }),
    );
  };

  const handleBottomPanel = () => {
    window.dispatchEvent(new Event("toggle-bottom-panel"));
  };

  const handleDrawing = () => {
    actions.setIsDrawing(!state.drawing.active);
  };

  const handleScreenshot = () => {
    actions.setIsScreenshotting(!state.screenshotting.active);
  };

  const handleRecording = () => {
    actions.setIsRecording(!state.recording.active);
  };

  const handleInspect = () => {
    inspector.actions.setInspectorState({
      kind: inspector.state.kind === "inspecting" ? "off" : "inspecting",
    });
  };

  const handleConsole = () => {
    actions.setRoute(state.activeRoute === "console" ? "off" : "console");
  };

  const handleNetwork = () => {
    actions.setRoute(state.activeRoute === "network" ? "off" : "network");
  };

  const handlePerformance = () => {
    actions.setRoute(
      state.activeRoute === "performance" ? "off" : "performance",
    );
  };

  const handleHttpClient = () => {
    window.dispatchEvent(new CustomEvent("toggle-http-client"));
  };

  const handlePluginStore = () => {
    window.dispatchEvent(new CustomEvent("toggle-plugin-store"));
  };

  return (
    <TooltipProvider>
      <div
        className={cn("flex w-12 flex-col gap-1  bg-background p-2", className)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleHome}
            >
              <Home className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Home</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleWebsiteTree}
            >
              <Folder className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Website Tree</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("toggle-next-lint"))
              }
            >
              <Zap className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Next.js Performance</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePluginStore}
            >
              <Store className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Plugin Store</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleReactTree}
            >
              <Component className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>React Component Tree</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleHttpClient}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>HTTP Client</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleChat}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Chat</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBottomPanel}
            >
              <PanelBottom className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Toggle Bottom Panel</p>
          </TooltipContent>
        </Tooltip>

        <div className="my-1 h-px bg-border/40" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.drawing.active && "bg-accent text-accent-foreground",
              )}
              onClick={handleDrawing}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Drawing Tool</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.screenshotting.active &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={handleScreenshot}
            >
              <Airplay className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Screenshot</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.recording.active && "bg-accent text-accent-foreground",
              )}
              onClick={handleRecording}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Record</p>
          </TooltipContent>
        </Tooltip>

        <div className="my-1 h-px bg-border/40" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                inspector.state.kind === "inspecting" &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={handleInspect}
            >
              <Inspect className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Inspect Element</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                window.dispatchEvent(new Event("toggle-react-scan"))
              }
            >
              <Scan className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>React Scan Outlines</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.activeRoute === "console" &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={handleConsole}
            >
              <Logs className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Console</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.activeRoute === "network" &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={handleNetwork}
            >
              <DownloadCloud className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Network</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.activeRoute === "performance" &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={handlePerformance}
            >
              <Gauge className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Performance</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
