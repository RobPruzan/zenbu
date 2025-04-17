"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useRef, useState } from "react";

import DevTools from "../components/devtools";
import { BetterDrawing } from "./better-drawing";
import { IFrameWrapper } from "./iframe-wrapper";
import { ScreenshotTool } from "./screenshot-tool";

import { getCommandItems } from "./command-items";
import {
  X,
  FileText,
  MessageSquare,
  SplitSquareHorizontal,
  Smartphone,
} from "lucide-react";

import { z } from "zod";
import { ChatInstanceContext, useChatStore } from "src/components/chat-store";
import { Chat } from "src/components/chat/chat";
import { CommandPalette } from "src/components/command-palette";
import { DevtoolsOverlay } from "src/components/devtools-overlay";
import { HttpClient } from "src/components/http-client/http-client";
import { LeaderKeyHints } from "src/components/leader-key-hints";
import { NextLint } from "src/components/next-lint/next-lint";
import { PluginStore } from "src/components/plugin-store/plugin-store";
import { ProjectCommandPalette } from "src/components/project-command-palette";
import { ReactTree } from "src/components/react-tree/react-tree";
import { Recording } from "src/components/recording";
import { BetterToolbar } from "src/components/slices/better-toolbar";
import { SlimSidebar } from "src/components/slim-sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "src/components/ui/resizable";
import * as ResizablePrimitive from "react-resizable-panels";
import { WebsiteTree } from "src/components/website-tree/website-tree";
import { trpc } from "src/lib/trpc";
import { cn } from "src/lib/utils";
import { Button } from "src/components/ui/button";
import dynamic from "next/dynamic";
import { ChildToParentMessage } from "zenbu-devtools";

export default function Home() {
  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <ChatInstanceContext.Provider initialValue={{}}>
        <IFrameWrapper>
          <></>
        </IFrameWrapper>
      </ChatInstanceContext.Provider>
    </main>
  );
}
