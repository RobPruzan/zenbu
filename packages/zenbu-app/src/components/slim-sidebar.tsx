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

interface SlimSidebarProps {
  className?: string;
}

export function SlimSidebar({ className }: SlimSidebarProps) {
  const { actions, state } = useChatStore((state) => state.toolbar);
  const inspector = useChatStore((state) => state.inspector);

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
        className={cn(
          "flex w-12 flex-col gap-1 border-r  bg-background p-2",
          className,
        )}
      >
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
