"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Component, Suspense, useEffect, useRef, useState } from "react";

import DevTools from "../components/devtools";
import { BetterDrawing } from "./better-drawing";
import { IFrameWrapper } from "./iframe-wrapper";
import { ScreenshotTool } from "./screenshot-tool";

import { getCommandItems } from "./command-items";
import {
  X,
  FileText,
  Code,
  Terminal,
  MessageSquare,
  Store,
  SplitSquareHorizontal,
  Smartphone,
} from "lucide-react";
import { TopBarContent } from "./top-bar-content";

import { z } from "zod";
// import { BottomPanel } from "src/components/bottom-panel";
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
import usePersistQueryClient from "src/hooks/use-persist-query-client";
import dynamic from "next/dynamic";
import { ChildToParentMessage } from "zenbu-devtools";

const BottomPanel = dynamic(() => import("src/components/bottom-panel"), {
  ssr: false,
});

interface SidebarState {
  component: "chat" | "websiteTree" | "reactTree" | null;
  position: "left" | "right";
}

export default function Home() {
  const [showPluginStore, setShowPluginStore] = useState(false);
  const [showNextLint, setShowNextLint] = useState(false);
  const [leftSidebar, setLeftSidebar] = useState<SidebarState>({
    component: null,
    position: "left",
  });
  const [rightSidebar, setRightSidebar] = useState<SidebarState>({
    component: null,
    position: "right",
  });
  const [devtoolsVisible, setDevtoolsVisible] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(false);
  const [horizontalSplit, setHorizontalSplit] = useState(false);
  const [mobileSplit, setMobileSplit] = useState(false);
  const [denseTabsEnabled, setDenseTabsEnabled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);
  const [projectPaletteOpen, setProjectPaletteOpen] = useState(false);
  const [showHttpClient, setShowHttpClient] = useState(false);

  const [leaderKeyPending, setLeaderKeyPending] = useState(false);
  const [showLeaderHints, setShowLeaderHints] = useState(false);
  const [leaderTimeoutId, setLeaderTimeoutId] = useState<number | null>(null);

  const bottomPanelRef =
    useRef<ResizablePrimitive.ImperativePanelHandle | null>(null);
  // usePersistQueryClient();

  useEffect(() => {
    const handleToggleChat = (event: CustomEvent) =>
      toggleSidebar("chat", event.detail?.position);
    const handleToggleWebsiteTree = (event: CustomEvent) =>
      toggleSidebar("websiteTree", event.detail?.position);
    const handleToggleReactTree = (event: CustomEvent) =>
      toggleSidebar("reactTree", event.detail?.position);
    const handleToggleHttpClient = () => setShowHttpClient((prev) => !prev);
    const handleTogglePluginStore = () => setShowPluginStore((prev) => !prev);
    const handleToggleTopBar = () => toggleVisibility("topBar");
    const handleToggleHorizontalSplit = () => {
      if (isAnimating) return;
      setIsAnimating(true);
      setHorizontalSplit((prev) => {
        const newState = !prev;
        if (newState) {
          setMobileSplit(false);
        }
        return newState;
      });
      setTimeout(() => setIsAnimating(false), 300);
    };
    const handleToggleMobileSplit = () => {
      if (isAnimating) return;
      setIsAnimating(true);
      setMobileSplit((prev) => {
        const newState = !prev;
        if (newState) {
          setHorizontalSplit(false);
        }
        return newState;
      });
      setTimeout(() => setIsAnimating(false), 300);
    };
    const handleToggleDenseTabs = () => toggleVisibility("denseTabs");
    const handleToggleBottomPanel = () =>
      setBottomPanelVisible((prev) => !prev);
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetElement = e.target as HTMLElement;
      if (
        targetElement.tagName === "INPUT" ||
        targetElement.tagName === "TEXTAREA" ||
        targetElement.tagName === "SELECT" ||
        targetElement.isContentEditable
      ) {
        return;
      }

      if (e.key === "p" && e.metaKey) {
        e.preventDefault();
        setProjectPaletteOpen((prev) => !prev);
      }
      console.log("key");

      if (e.key === "j" && e.metaKey) {
        console.log("do i run???");

        e.preventDefault();
        setBottomPanelVisible((prev) => !prev);
      }

      if (showLeaderHints && e.key === "Escape") {
        e.preventDefault();
        setShowLeaderHints(false);
        return;
      }

      if (leaderKeyPending) {
        if (leaderTimeoutId) clearTimeout(leaderTimeoutId);
        setLeaderTimeoutId(null);
        setLeaderKeyPending(false);

        console.log(`Leader combination: Space + ${e.key}`);
        e.preventDefault();
        return;
      }

      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        setLeaderKeyPending(true);

        const timeoutId = window.setTimeout(() => {
          setShowLeaderHints(true);
          setLeaderKeyPending(false);
          setLeaderTimeoutId(null);
        }, 300);
        setLeaderTimeoutId(timeoutId);
        return;
      }

      if (showLeaderHints && e.key !== "Escape") {
        setShowLeaderHints(false);
      }
    };

    const handleMessage = (event: MessageEvent<ChildToParentMessage>) => {
      const data = event.data;

      if (data.kind === "keydown") {
        const e = data;

        if (e.key === "p" && e.metaKey) {
          setProjectPaletteOpen((prev) => !prev);
        }

        if (e.key === "j" && e.metaKey) {
          setBottomPanelVisible((prev) => !prev);
        }

        if (showLeaderHints && e.key === "Escape") {
          setShowLeaderHints(false);
          return;
        }

        if (leaderKeyPending) {
          if (leaderTimeoutId) clearTimeout(leaderTimeoutId);
          setLeaderTimeoutId(null);
          setLeaderKeyPending(false);

          console.log(`Leader combination: Space + ${e.key}`);
          return;
        }

        if (e.key === " " && !e.repeat) {
          setLeaderKeyPending(true);

          const timeoutId = window.setTimeout(() => {
            setShowLeaderHints(true);
            setLeaderKeyPending(false);
            setLeaderTimeoutId(null);
          }, 300);
          setLeaderTimeoutId(timeoutId);
          return;
        }

        if (showLeaderHints && e.key !== "Escape") {
          setShowLeaderHints(false);
        }
      }
    };

    const handleToggleNextLint = () => {
      setShowNextLint((prev) => !prev);
    };

    window.addEventListener("toggle-chat", handleToggleChat as EventListener);
    window.addEventListener(
      "toggle-website-tree",
      handleToggleWebsiteTree as EventListener,
    );
    window.addEventListener(
      "toggle-react-tree",
      handleToggleReactTree as EventListener,
    );
    window.addEventListener("toggle-http-client", handleToggleHttpClient);
    window.addEventListener("toggle-plugin-store", handleTogglePluginStore);
    window.addEventListener("toggle-top-bar", handleToggleTopBar);
    window.addEventListener("toggle-split", handleToggleHorizontalSplit);
    window.addEventListener("toggle-mobile-split", handleToggleMobileSplit);
    window.addEventListener("toggle-dense-tabs", handleToggleDenseTabs);
    window.addEventListener("toggle-bottom-panel", handleToggleBottomPanel);
    window.addEventListener("toggle-next-lint", handleToggleNextLint);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener(
        "toggle-chat",
        handleToggleChat as EventListener,
      );
      window.removeEventListener(
        "toggle-website-tree",
        handleToggleWebsiteTree as EventListener,
      );
      window.removeEventListener(
        "toggle-react-tree",
        handleToggleReactTree as EventListener,
      );
      window.removeEventListener("toggle-http-client", handleToggleHttpClient);
      window.removeEventListener(
        "toggle-plugin-store",
        handleTogglePluginStore,
      );
      window.removeEventListener("toggle-top-bar", handleToggleTopBar);
      window.removeEventListener("toggle-split", handleToggleHorizontalSplit);
      window.removeEventListener(
        "toggle-mobile-split",
        handleToggleMobileSplit,
      );
      window.removeEventListener("toggle-dense-tabs", handleToggleDenseTabs);
      window.removeEventListener(
        "toggle-bottom-panel",
        handleToggleBottomPanel,
      );
      window.removeEventListener("toggle-next-lint", handleToggleNextLint);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("message", handleMessage);
    };
  }, [isAnimating, leaderKeyPending, leaderTimeoutId, showLeaderHints]);

  const toggleSidebar = (
    component: "chat" | "websiteTree" | "reactTree",
    position: "left" | "right" = "left",
  ) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const targetSetter = position === "left" ? setLeftSidebar : setRightSidebar;
    const otherSetter = position === "left" ? setRightSidebar : setLeftSidebar;
    const currentState = position === "left" ? leftSidebar : rightSidebar;

    if (currentState.component === component) {
      targetSetter({ component: null, position });
    } else {
      const otherState = position === "left" ? rightSidebar : leftSidebar;
      if (otherState.component === component) {
        otherSetter({ component: null, position: otherState.position });
      }

      targetSetter({ component, position });
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  const toggleVisibility = (component: "devtools" | "topBar" | "denseTabs") => {
    if (isAnimating) return;
    setIsAnimating(true);

    switch (component) {
      case "devtools":
        setDevtoolsVisible((prev) => !prev);
        break;
      case "topBar":
        setTopBarVisible((prev) => !prev);
        break;
      case "denseTabs":
        setDenseTabsEnabled((prev) => !prev);
        break;
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  // should fetch projects, by default read the first one
  // i guess it would also be good to always spawn on the last project user was on, that feels more like a local state thing
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const project = projects.at(0);
  const createProjectMutation = trpc.daemon.createProject.useMutation();

  if (!project) {
    return (
      <div className="flex h-screen w-full flex-col bg-background">
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-primary"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-xl font-bold">Zenbu</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-2xl px-6 py-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              Welcome to Zenbu
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Your intelligent development environment
            </p>

            <div className="mx-auto max-w-md">
              <div className="mb-6 rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">
                  Create your first project
                </h2>
                <p className="mb-6 text-muted-foreground">
                  Start by creating a new project to explore all the features
                  Zenbu has to offer.
                </p>
                <Button
                  variant={"outline"}
                  onClick={() => {
                    createProjectMutation.mutate();
                  }}
                  disabled={createProjectMutation.isPending}
                  className="w-full"
                >
                  {createProjectMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating your project...
                    </span>
                  ) : (
                    "Create New Project"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // we need to remove the coupling with the "default" project, wont be using that anymore since now that just complicates things

  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <ChatInstanceContext.Provider
        initialValue={{
          iframe: {
            url: `http://localhost:${project.port}`,
            projectId: project.id!, // whatever
          },
          toolbar: {
            state: {
              activeRoute: "off",
              drawing: {
                active: false,
                getEditor: () => null,
              },
              screenshotting: {
                active: false,
              },
              recording: {
                active: false,
              },
            },
          },
          context: {
            items: [],
          },
          inspector: {
            state: {
              kind: "off",
            },
          },
          eventLog: {
            events: [],
          },
          chatControls: {
            input: "",
          },
        }}
      >
        <SlimSidebar />
        <ProjectCommandPalette
          isOpen={projectPaletteOpen}
          onClose={() => setProjectPaletteOpen(false)}
        />
        <PluginStore
          isOpen={showPluginStore}
          onClose={() => setShowPluginStore(false)}
        />
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className="flex h-full w-full overflow-hidden">
            <AnimatePresence mode="wait">
              {showNextLint && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "320px", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="relative border-r border-border/40"
                >
                  <NextLint />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {leftSidebar.component && (
                <motion.div
                  key={`left-sidebar-${leftSidebar.component}`}
                  initial={{ width: 0, opacity: 0, marginRight: 0 }}
                  animate={{
                    width: leftSidebar.component === "chat" ? "25%" : "16%",
                    opacity: 1,
                    marginRight: 0,
                    transition: {
                      width: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8,
                      },
                      opacity: { duration: 0.1, delay: 0.05 },
                    },
                  }}
                  exit={{
                    width: 0,
                    opacity: 0,
                    marginRight: "-1px",
                    transition: {
                      width: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8,
                      },
                      opacity: { duration: 0.1 },
                    },
                  }}
                  className="h-full flex-shrink-0 border-r border-border/40 overflow-hidden"
                  style={{ minWidth: 0 }}
                >
                  {leftSidebar.component === "chat" ? (
                    <div className="relative flex h-full flex-col">
                      <Chat onCloseChat={() => toggleSidebar("chat", "left")} />
                    </div>
                  ) : leftSidebar.component === "websiteTree" ? (
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      }
                    >
                      <WebsiteTree
                        onClose={() => toggleSidebar("websiteTree", "left")}
                        onSelect={() => {}}
                        // onSelect={handleWebsiteSelect}
                      />
                    </Suspense>
                  ) : leftSidebar.component === "reactTree" ? (
                    <ReactTree
                      onClose={() => toggleSidebar("reactTree", "left")}
                    />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={cn(
                "flex h-full flex-1 flex-col overflow-hidden",
                mobileSplit && "min-w-[750px]",
              )}
            >
              <AnimatePresence mode="wait">
                {topBarVisible && (
                  <motion.div
                    key="top-bar"
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      marginBottom: 0,
                      transition: {
                        height: { type: "spring", stiffness: 400, damping: 30 },
                        opacity: { duration: 0.2, delay: 0.05 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      marginBottom: "-1px",
                      transition: {
                        height: { duration: 0.2 },
                        opacity: { duration: 0.15 },
                      },
                    }}
                    className="relative flex-shrink-0 border-b border-border/40 overflow-hidden bg-background"
                  >
                    {/* <TopBarContent
                      dense={denseTabsEnabled}
                      tabs={tabs}
                      activeTabId={activeTab}
                      onTabSelect={handleTabSelect}
                      onTabClose={}
                      onNewTab={handleNewTab}
                    /> */}
                  </motion.div>
                )}
              </AnimatePresence>

              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel
                  defaultSize={bottomPanelVisible ? 70 : 100}
                  className="relative"
                >
                  <ResizablePanelGroup
                    direction={
                      horizontalSplit || mobileSplit ? "horizontal" : "vertical"
                    }
                    className="h-full"
                  >
                    <ResizablePanel
                      defaultSize={
                        devtoolsVisible
                          ? 70
                          : horizontalSplit || mobileSplit
                            ? 50
                            : 100
                      }
                      className="relative"
                      minSize={
                        horizontalSplit || mobileSplit
                          ? 20
                          : devtoolsVisible
                            ? 15
                            : topBarVisible
                              ? 0
                              : 100
                      }
                    >
                      <div className="flex h-full flex-col">
                        {showHttpClient ? (
                          <HttpClient onBack={() => setShowHttpClient(false)} />
                        ) : (
                          <IFrameWrapper>
                            <ScreenshotTool />
                            <BetterToolbar />
                            <DevtoolsOverlay />
                            <BetterDrawing />
                            <Recording />
                          </IFrameWrapper>
                        )}
                      </div>
                    </ResizablePanel>

                    {(horizontalSplit || mobileSplit) && (
                      <>
                        <ResizableHandle withHandle className="bg-border/40" />
                        <ResizablePanel
                          defaultSize={horizontalSplit ? 50 : undefined}
                          minSize={horizontalSplit ? 20 : undefined}
                          collapsible={false}
                          className={
                            mobileSplit
                              ? "flex items-center justify-center p-4 bg-background"
                              : ""
                          }
                        >
                          {mobileSplit ? (
                            <div className="relative mx-auto h-[852px] w-[393px] flex-shrink-0 overflow-hidden rounded-[40px] border-[10px] border-black bg-black shadow-xl">
                              <div className="h-full w-full overflow-hidden rounded-[30px]">
                                <IFrameWrapper>
                                  <></>
                                  {/* <BetterToolbar />
                                  <DevtoolsOverlay /> */}
                                </IFrameWrapper>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full flex-col">
                              <IFrameWrapper>
                                <p className="p-4 text-sm text-muted-foreground">
                                  Second iframe area
                                </p>
                                <BetterToolbar />
                                <DevtoolsOverlay />
                              </IFrameWrapper>
                            </div>
                          )}
                        </ResizablePanel>
                      </>
                    )}

                    {!horizontalSplit && !mobileSplit && devtoolsVisible && (
                      <>
                        <ResizableHandle withHandle className="bg-border/40" />
                        <ResizablePanel
                          defaultSize={30}
                          minSize={15}
                          collapsible={true}
                          className="relative"
                        >
                          <div className="flex h-full flex-col border-t border-zinc-800/80">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full hover:bg-background/80"
                              onClick={() => toggleSidebar("chat", "left")}
                              disabled={isAnimating}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <DevTools
                              onClose={() => toggleSidebar("chat", "left")}
                            />
                          </div>
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </ResizablePanel>

                {bottomPanelVisible && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel ref={bottomPanelRef} defaultSize={30}>
                      <BottomPanel
                        open={() => {
                          setBottomPanelVisible(true);
                        }}
                        isOpen={bottomPanelVisible}
                        close={() => {
                          // doesn't work, ill figure it out later idec anymore
                          bottomPanelRef.current?.resize(0);
                          setBottomPanelVisible(false);
                        }}
                      />
                    </ResizablePanel>
                  </>
                )}
                {/* <div
                  style={
                    {
                      // maxHeight: bottomPanelVisible ? "auto" : "0px",
                    }
                  }
                > */}

                {/* </div> */}
              </ResizablePanelGroup>
            </div>

            <AnimatePresence mode="wait">
              {rightSidebar.component && (
                <motion.div
                  key={`right-sidebar-${rightSidebar.component}`}
                  initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                  animate={{
                    width: rightSidebar.component === "chat" ? "25%" : "16%",
                    opacity: 1,
                    marginLeft: 0,
                    transition: {
                      width: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8,
                      },
                      opacity: { duration: 0.1, delay: 0.05 },
                    },
                  }}
                  exit={{
                    width: 0,
                    opacity: 0,
                    marginLeft: "-1px",
                    transition: {
                      width: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8,
                      },
                      opacity: { duration: 0.1 },
                    },
                  }}
                  className="h-full flex-shrink-0 border-l border-border/40 overflow-hidden"
                  style={{ minWidth: 0 }}
                >
                  {rightSidebar.component === "chat" ? (
                    <div className="relative flex h-full flex-col">
                      <Chat
                        onCloseChat={() => toggleSidebar("chat", "right")}
                      />
                    </div>
                  ) : rightSidebar.component === "websiteTree" ? (
                    <WebsiteTree
                      onClose={() => toggleSidebar("websiteTree", "right")}
                      onSelect={handleWebsiteSelect}
                    />
                  ) : rightSidebar.component === "reactTree" ? (
                    <ReactTree
                      onClose={() => toggleSidebar("reactTree", "right")}
                    />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <CommandWrapper
          onToggleChat={(position) => toggleSidebar("chat", position)}
          onToggleWebsiteTree={(position) =>
            toggleSidebar("websiteTree", position)
          }
        />

        {/* Render Leader Key Hints */}
        <LeaderKeyHints
          isVisible={showLeaderHints}
          onClose={() => setShowLeaderHints(false)}
        />
      </ChatInstanceContext.Provider>
    </main>
  );
}

interface CommandWrapperProps {
  onToggleChat: (position: "left" | "right") => void;
  onToggleWebsiteTree: (position: "left" | "right") => void;
}

const CommandWrapper: React.FC<CommandWrapperProps> = ({
  onToggleChat,
  onToggleWebsiteTree,
}) => {
  const toolbarState = useChatStore((state) => state.toolbar);
  const inspector = useChatStore((state) => state.inspector);

  const iframe = useChatStore((state) => state.iframe);

  const utils = trpc.useUtils();

  const additionalCommands = [
    {
      id: "toggle-chat-left",
      shortcut: "Toggle Chat Left",
      icon: <MessageSquare className="h-5 w-5" />,
      onSelect: () => onToggleChat("left"),
    },
    {
      id: "toggle-chat-right",
      shortcut: "Toggle Chat Right",
      icon: <MessageSquare className="h-5 w-5" />,
      onSelect: () => onToggleChat("right"),
    },
    {
      id: "toggle-website-tree-left",
      shortcut: "Toggle Website Tree Left",
      icon: <FileText className="h-5 w-5" />,
      onSelect: () => onToggleWebsiteTree("left"),
    },
    {
      id: "toggle-mobile-split",
      shortcut: "Toggle Mobile Split",
      icon: <Smartphone className="h-5 w-5" />,
      onSelect: () => window.dispatchEvent(new Event("toggle-mobile-split")),
    },
    {
      id: "toggle-split",
      shortcut: "Toggle Split",
      icon: <SplitSquareHorizontal className="h-5 w-5" />,
      onSelect: () => window.dispatchEvent(new Event("toggle-split")),
    },
    {
      id: "toggle-website-tree-right",
      shortcut: "Toggle Website Tree Right",
      icon: <FileText className="h-5 w-5" />,
      onSelect: () => onToggleWebsiteTree("right"),
    },
  ];

  const items = [
    ...getCommandItems({
      ...toolbarState,
      inspector,
      createProjectLoading: false,
      onCreateProject: async () => {
        // createProjectMutation.mutate()

        // todo: because we have to invalidate everything on the mutation, the create project + nav is blocked by other queries, so will need to pass meta in this mutation to precisely invalidate
        const json = await fetch("http://localhost:40000/projects", {
          method: "POST",
        }).then((res) => res.json());

        const schema = z.object({
          name: z.string(),
          port: z.number(),
          pid: z.number(),
          cwd: z.string(),
        });
        const data = schema.parse(json);
        iframe.actions.setInspectorState({
          url: `http://localhost:${data.port}`,
        });

        utils.daemon.getProjects.refetch();
      },
    }),
    ...additionalCommands,
  ];

  return <CommandPalette items={items} />;
};
