"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Component, useEffect, useState } from "react";
import {
  ChatInstanceContext,
  useChatStore,
} from "~/components/chat-instance-context";
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
import { X, FileText, Code, Terminal, MessageSquare } from "lucide-react";
import { TopBarContent } from "./top-bar-content";
import { WebsiteTree } from "~/components/website-tree/website-tree";
import { SlimSidebar } from "~/components/slim-sidebar";
import { BottomPanel } from "~/components/bottom-panel";
import { ProjectCommandPalette } from "~/components/project-command-palette";
import { ReactTree } from "~/components/react-tree/react-tree";
import { HttpClient } from "~/components/http-client/http-client";

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
  const [isSplit, setIsSplit] = useState(false);
  const [denseTabsEnabled, setDenseTabsEnabled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("main");
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);
  const [websiteTreeVisible, setWebsiteTreeVisible] = useState(false);
  const [projectPaletteOpen, setProjectPaletteOpen] = useState(false);
  const [showHttpClient, setShowHttpClient] = useState(false);

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
    const handleToggleHttpClient = () => setShowHttpClient(prev => !prev);
    const handleToggleTopBar = (event: Event) => toggleVisibility("topBar");
    const handleToggleSplit = (event: Event) => toggleVisibility("split");
    const handleToggleDenseTabs = (event: Event) =>
      toggleVisibility("denseTabs");
    const handleToggleBottomPanel = () =>
      setBottomPanelVisible((prev) => !prev);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" && e.metaKey) {
        e.preventDefault();
        setProjectPaletteOpen(true);
      }
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
    window.addEventListener("toggle-top-bar", handleToggleTopBar);
    window.addEventListener("toggle-split", handleToggleSplit);
    window.addEventListener("toggle-dense-tabs", handleToggleDenseTabs);
    window.addEventListener("toggle-bottom-panel", handleToggleBottomPanel);
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
      window.removeEventListener("toggle-top-bar", handleToggleTopBar);
      window.removeEventListener("toggle-split", handleToggleSplit);
      window.removeEventListener("toggle-dense-tabs", handleToggleDenseTabs);
      window.removeEventListener(
        "toggle-bottom-panel",
        handleToggleBottomPanel,
      );
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
    component: "devtools" | "topBar" | "split" | "denseTabs",
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
      case "split":
        setIsSplit((prev) => !prev);
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
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className="flex h-full w-full overflow-hidden">
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
                    <WebsiteTree
                      onClose={() => toggleSidebar("websiteTree", "left")}
                      onSelect={handleWebsiteSelect}
                    />
                  ) : leftSidebar.component === "reactTree" ? (
                    <ReactTree
                      onClose={() => toggleSidebar("reactTree", "left")}
                    />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex h-full flex-1 flex-col overflow-hidden">
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

              <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup
                  direction={isSplit ? "horizontal" : "vertical"}
                  className="h-full"
                >
                  <ResizablePanel
                    defaultSize={devtoolsVisible || isSplit ? 70 : 100}
                    className="relative"
                    minSize={
                      isSplit
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

                  {isSplit && (
                    <>
                      <ResizableHandle withHandle className="bg-border/40" />
                      <ResizablePanel defaultSize={30} minSize={20}>
                        <div className="flex h-full flex-col">
                          <IFrameWrapper>
                            <p className="p-4 text-sm text-muted-foreground">
                              Second iframe area
                            </p>
                            <BetterToolbar />
                            <DevtoolsOverlay />
                          </IFrameWrapper>
                        </div>
                      </ResizablePanel>
                    </>
                  )}

                  {!isSplit && devtoolsVisible && (
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

                {isSplit && devtoolsVisible && (
                  <div className="h-[30%] min-h-[100px] border-t border-zinc-800/80 relative flex flex-col flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full hover:bg-background/80"
                      onClick={() => toggleSidebar("chat", "left")}
                      disabled={isAnimating}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <DevTools onClose={() => toggleSidebar("chat", "left")} />
                  </div>
                )}
              </div>
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

  const additionalCommands = [
    {
      id: "toggle-chat-left",
      title: "Toggle Chat (Left)",
      shortcut: "Ctrl+Shift+L",
      icon: <MessageSquare className="h-5 w-5" />,
      onSelect: () => onToggleChat("left"),
    },
    {
      id: "toggle-chat-right",
      title: "Toggle Chat (Right)",
      shortcut: "Ctrl+Shift+R",
      icon: <MessageSquare className="h-5 w-5" />,
      onSelect: () => onToggleChat("right"),
    },
    {
      id: "toggle-website-tree-left",
      title: "Toggle Website Tree (Left)",
      shortcut: "Ctrl+Shift+W",
      icon: <FileText className="h-5 w-5" />,
      onSelect: () => onToggleWebsiteTree("left"),
    },
    {
      id: "toggle-website-tree-right",
      title: "Toggle Website Tree (Right)",
      shortcut: "Ctrl+Alt+W",
      icon: <FileText className="h-5 w-5" />,
      onSelect: () => onToggleWebsiteTree("right"),
    },
  ];

  const items = [
    ...getCommandItems({ ...toolbarState, inspector }),
    ...additionalCommands,
  ];

  return <CommandPalette items={items} />;
};
