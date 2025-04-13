"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Component, Suspense, useEffect, useState } from "react";
import { ChatInstanceContext, useChatStore } from "~/components/chat-store";
import { Chat } from "~/components/chat/chat";
import { CommandPalette } from "~/components/command-palette";
import { DevtoolsOverlay } from "~/components/devtools-overlay";
import { BetterToolbar } from "~/components/slices/better-toolbar";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import DevTools from "../components/devtools";
import { BetterDrawing } from "./better-drawing";
import { IFrameWrapper } from "./iframe-wrapper";
import { ScreenshotTool } from "./screenshot-tool";
import { Recorder } from "~/components/screen-sharing";
import { Recording } from "~/components/recording";
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
import { WebsiteTree } from "~/components/website-tree/website-tree";
import { SlimSidebar } from "~/components/slim-sidebar";
import { BottomPanel } from "~/components/bottom-panel";
import { ProjectCommandPalette } from "~/components/project-command-palette";
import { ReactTree } from "~/components/react-tree/react-tree";
import { HttpClient } from "~/components/http-client/http-client";
import { PluginStore } from "~/components/plugin-store/plugin-store";
import { NextLint } from "~/components/next-lint/next-lint";
import { LeaderKeyHints } from "~/components/leader-key-hints";
import { trpc } from "~/lib/trpc";
import { z } from "zod";
import { cn } from "~/lib/utils";

interface TabData {
  id: string;
  title: string;
  icon: React.ReactNode;
  url?: string; // Optional URL for iframe content
}

interface SidebarState {
  component: "chat" | "websiteTree" | "reactTree" | null;
  position: "left" | "right";
}

export default function Home() {
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
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
  const [activeTab, setActiveTab] = useState<string>("main");
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);
  const [websiteTreeVisible, setWebsiteTreeVisible] = useState(false);
  const [projectPaletteOpen, setProjectPaletteOpen] = useState(false);
  const [showHttpClient, setShowHttpClient] = useState(false);

  // State for leader key hints
  const [leaderKeyPending, setLeaderKeyPending] = useState(false);
  const [showLeaderHints, setShowLeaderHints] = useState(false);
  const [leaderTimeoutId, setLeaderTimeoutId] = useState<number | null>(null);

  // New state for managing tabs
  const [tabs, setTabs] = useState<TabData[]>([
    { id: "main", title: "Main", icon: <FileText size={14} /> },
    { id: "code", title: "Editor", icon: <Code size={14} /> },
    { id: "terminal", title: "Terminal", icon: <Terminal size={14} /> },
  ]);

  useEffect(() => {
    const handleToggleChat = (event: CustomEvent) =>
      toggleSidebar("chat", event.detail?.position);
    const handleToggleWebsiteTree = (event: CustomEvent) =>
      toggleSidebar("websiteTree", event.detail?.position);
    const handleToggleReactTree = (event: CustomEvent) =>
      toggleSidebar("reactTree", event.detail?.position);
    const handleToggleHttpClient = () => setShowHttpClient((prev) => !prev);
    const handleTogglePluginStore = () => setShowPluginStore((prev) => !prev);
    const handleToggleTopBar = (event: Event) => toggleVisibility("topBar");
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
    const handleToggleDenseTabs = (event: Event) =>
      toggleVisibility("denseTabs");
    const handleToggleBottomPanel = () =>
      setBottomPanelVisible((prev) => !prev);
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keydown events if an input, textarea, or select element is focused
      const targetElement = e.target as HTMLElement;
      if (
        targetElement.tagName === "INPUT" ||
        targetElement.tagName === "TEXTAREA" ||
        targetElement.tagName === "SELECT" ||
        targetElement.isContentEditable
      ) {
        return;
      }

      // Project Palette shortcut
      if (e.key === "p" && e.metaKey) {
        e.preventDefault();
        setProjectPaletteOpen((prev) => !prev);
      }

      // Leader Key Logic
      if (showLeaderHints && e.key === "Escape") {
        e.preventDefault();
        setShowLeaderHints(false);
        return;
      }

      if (leaderKeyPending) {
        // Clear timeout if another key is pressed after leader
        if (leaderTimeoutId) clearTimeout(leaderTimeoutId);
        setLeaderTimeoutId(null);
        setLeaderKeyPending(false);

        // TODO: Handle actual leader key combinations here
        // e.g., if (e.key === 'f') { triggerFindFile(); }
        console.log(`Leader combination: Space + ${e.key}`);
        e.preventDefault(); // Prevent default action for the combo key
        return;
      }

      if (e.key === " " && !e.repeat) { // Space bar pressed (not held)
        e.preventDefault(); // Prevent default scroll behavior
        setLeaderKeyPending(true);

        // Set timeout to show hints if no other key is pressed
        const timeoutId = window.setTimeout(() => {
          setShowLeaderHints(true);
          setLeaderKeyPending(false);
          setLeaderTimeoutId(null);
        }, 300); // Changed timeout to 300ms
        setLeaderTimeoutId(timeoutId);
        return;
      }

       // Hide hints if any other key is pressed while they are visible
      if (showLeaderHints && e.key !== "Escape") { // Allow escape to pass through if needed elsewhere
        setShowLeaderHints(false);
         // Optional: you might want to process this key press as a normal command
         // if it wasn't part of a leader sequence.
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
      window.removeEventListener("toggle-mobile-split", handleToggleMobileSplit);
      window.removeEventListener("toggle-dense-tabs", handleToggleDenseTabs);
      window.removeEventListener(
        "toggle-bottom-panel",
        handleToggleBottomPanel,
      );
      window.removeEventListener("toggle-next-lint", handleToggleNextLint);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnimating]);

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
      // Close if it's already open
      targetSetter({ component: null, position });
    } else {
      // Close other sidebar if it's showing the same component
      const otherState = position === "left" ? rightSidebar : leftSidebar;
      if (otherState.component === component) {
        otherSetter({ component: null, position: otherState.position });
      }

      // Open in target position
      targetSetter({ component, position });
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  const toggleVisibility = (
    component: "devtools" | "topBar" | "denseTabs",
  ) => {
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

  const handleTabSelect = (id: string) => {
    setActiveTab(id);
    // You would update iframe content or do other actions based on tab selection
  };

  const handleNewTab = () => {
    const tabId = `tab-${Date.now()}`;
    const newTab: TabData = {
      id: tabId,
      title: `Tab ${tabs.length + 1}`,
      icon: <FileText size={14} />,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(tabId); // Automatically select the new tab
  };

  const handleCloseTab = (id: string) => {
    // Don't allow closing the last tab
    if (tabs.length <= 1) return;

    // If closing the active tab, select another tab
    if (id === activeTab) {
      const tabIndex = tabs.findIndex((tab) => tab.id === id);
      // Select previous tab if available, otherwise the next one
      const newActiveTab = tabs[tabIndex - 1]?.id || tabs[tabIndex + 1]?.id;
      setActiveTab(newActiveTab);
    }

    // Remove the tab
    setTabs(tabs.filter((tab) => tab.id !== id));
  };

  const handleWebsiteSelect = (url: string) => {
    // Handle website selection, e.g., open in iframe or new tab
    console.log("Selected website:", url);
  };

  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <ChatInstanceContext.Provider
        initialValue={{
          iframe: {
            url: "http://localhost:4200",
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
                        onSelect={handleWebsiteSelect}
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

            <div className={cn(
              "flex h-full flex-1 flex-col overflow-hidden",
              mobileSplit && "min-w-[750px]"
            )}>
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
                    <TopBarContent
                      dense={denseTabsEnabled}
                      tabs={tabs}
                      activeTabId={activeTab}
                      onTabSelect={handleTabSelect}
                      onTabClose={handleCloseTab}
                      onNewTab={handleNewTab}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel
                  defaultSize={bottomPanelVisible ? 70 : 100}
                  className="relative"
                >
                  <ResizablePanelGroup
                    direction={horizontalSplit || mobileSplit ? "horizontal" : "vertical"}
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
                          className={mobileSplit ? "flex items-center justify-center p-4 bg-background" : ""}
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

                <AnimatePresence>
                  {bottomPanelVisible && (
                    <>
                      <ResizablePanel defaultSize={30} minSize={15}>
                        <BottomPanel
                          isOpen={bottomPanelVisible}
                          onClose={() => setBottomPanelVisible(false)}
                        />
                      </ResizablePanel>
                    </>
                  )}
                </AnimatePresence>
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
  const createProjectMutation = trpc.daemon.createProject.useMutation({
    onSuccess: (result) => {
      // projectsQuery.refetch();
      iframe.actions.setInspectorState({
        url: `http://localhost:${result.port}`,
      });
    },
  });

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
