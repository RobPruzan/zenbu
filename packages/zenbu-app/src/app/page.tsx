"use client";
/**
 *
 *
 *
 * THIS IS ALL PROTOTYPE UI THIS IS NOT WHAT'S BEING USED
 */
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";

import DevTools from "../components/devtools";
import { BetterDrawing } from "./better-drawing";
import { IFrameWrapper } from "./iframe-wrapper";
import { ScreenshotTool } from "./screenshot-tool";

import { getCommandItems } from "./command-items";
import {
  X,
  FileText,
  Terminal,
  MessageSquare,
  SplitSquareHorizontal,
  Smartphone,
  PlusCircle,
  Folder,
  GitBranch,
  TerminalSquare,
  Network,
  Atom,
  FlaskConical,
  Plus,
} from "lucide-react";

// import { BottomPanel } from "src/components/bottom-panel";
import { ChatInstanceContext, useChatStore } from "src/components/chat-store";
import { Chat } from "src/components/chat/chat";
import { CommandPalette } from "src/components/command-palette";
import {
  DevtoolsOverlay,
  useMakeRequest,
} from "src/components/devtools-overlay";
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
import { trpc } from "src/lib/trpc";
import { cn } from "src/lib/utils";
import { Button } from "src/components/ui/button";
import dynamic from "next/dynamic";
import { ChildToParentMessage } from "zenbu-devtools";
import { ProjectsSidebar } from "./project-sidebar";
import { scan } from "react-scan";
import { useWS } from "./ws";
import { nanoid } from "nanoid";
import { useIFrameMessenger } from "src/hooks/use-iframe-listener";
import { HomePage } from "src/components/slim-sidebar";
import { utils } from "prettier/doc.js";

// scan();
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
  const [showHome, setShowHome] = useState(true);
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
    const handleToggleHome = () => setShowHome((prev) => !prev);
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

        // @ts-expect-error
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
    window.addEventListener("toggle-home", handleToggleHome);
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
      window.removeEventListener("toggle-home", handleToggleHome);
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

  const createProjectMutation = trpc.daemon.createProject.useMutation({
    meta: {
      noInvalidate: true,
    },
  });
  const startProjectMutation = trpc.daemon.startProject.useMutation();
  const firstRunningProject = projects.find(
    (project) => project.status === "running",
  );

  const firstProject = projects.at(0);

  const utils = trpc.useUtils();

  if (!firstProject) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <ChatInstanceContext.Provider
          initialValue={{
            iframe: {
              project: undefined,
              url: undefined,
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
          <CommandPalette
            items={[
              {
                shortcut: "Create Next App",
                icon: <Plus size={16} />,
                onSelect: async () => {
                  const newProject = await createProjectMutation.mutateAsync();
                  const checkUrlReady = () => {
                    const hiddenIframe = document.createElement("iframe");
                    hiddenIframe.style.display = "none";
                    hiddenIframe.src = `http://localhost:${newProject.port}`;
                    hiddenIframe.onload = () => {
                      setTimeout(() => {
                        utils.daemon.getProjects.setData(undefined, (prev) =>
                          !prev ? [newProject] : [...prev, newProject],
                        );
                      }, 20);
                      if (document.documentElement.contains(hiddenIframe)) {
                        document.documentElement.removeChild(hiddenIframe);
                      }
                    };
                    hiddenIframe.onerror = () => {
                      if (document.documentElement.contains(hiddenIframe)) {
                        document.documentElement.removeChild(hiddenIframe);
                      }
                      setTimeout(checkUrlReady, 10);
                    };
                    document.documentElement.appendChild(hiddenIframe);
                  };
                  checkUrlReady();
                },
              },

              {
                shortcut: "Create Expo App",
                icon: <Atom size={16} />,
                onSelect: () => {},
              },

              {
                shortcut: "Active Ports",
                icon: <Network size={16} />,
                onSelect: () => {},
              },
              {
                shortcut: "Terminal",
                icon: <TerminalSquare />,
                onSelect: () => {},
              },
              {
                shortcut: "Experiment",
                icon: <FlaskConical />,
                onSelect: () => {},
              },
            ]}
          />
          <HomePage />
        </ChatInstanceContext.Provider>
      </div>
    );
  }

  if (!firstRunningProject) {
    return (
      <div>
        lil bro u have no running projects
        {projects.map((project) => (
          <div
            key={project.name}
            className="flex items-center justify-center gap-x-3"
          >
            <span>{project.name}</span>

            <Button
              onClick={() => {
                startProjectMutation.mutate({ name: project.name });
              }}
              variant={"outline"}
            >
              Start
            </Button>
          </div>
        ))}
      </div>
    );
  }

  // we need to remove the coupling with the "default" project, wont be using that anymore since now that just complicates things

  utils.project.getEvents.prefetch({ projectName: firstRunningProject.name });

  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <ChatInstanceContext.Provider
        initialValue={{
          iframe: {
            project: firstRunningProject,
            url: `http://localhost:${firstRunningProject.port}`,
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
        <div className="flex-1 relative border-black border-l-0">
          {showHome ? (
            <HomePage />
          ) : (
            <>
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
                        animate={{ width: "400px", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          mass: 0.8,
                        }}
                        className="relative border-r "
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
                          width:
                            leftSidebar.component === "chat" ? "25%" : "16%",
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
                        className="h-full flex-shrink-0 border-r  overflow-hidden"
                        style={{
                          minWidth:
                            leftSidebar.component === "chat"
                              ? "300px"
                              : "200px",
                        }}
                      >
                        {leftSidebar.component === "chat" ? (
                          <div className="relative flex h-full flex-col">
                            <Chat
                              onCloseChat={() => toggleSidebar("chat", "left")}
                            />
                          </div>
                        ) : leftSidebar.component === "websiteTree" ? (
                          <Suspense
                            fallback={
                              <div className="flex h-full items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              </div>
                            }
                          >
                            <ProjectsSidebar
                              onNuke={() => {
                                setLeftSidebar({
                                  component: null,
                                  position: "left",
                                });
                              }}
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
                    <ResizablePanelGroup
                      direction="vertical"
                      className="h-full"
                    >
                      <ResizablePanel
                        defaultSize={bottomPanelVisible ? 70 : 100}
                        className="relative"
                      >
                        <ResizablePanelGroup
                          direction={
                            horizontalSplit || mobileSplit
                              ? "horizontal"
                              : "vertical"
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
                          >
                            <div className="flex h-full flex-col">
                              {showHttpClient ? (
                                <HttpClient
                                  onBack={() => setShowHttpClient(false)}
                                />
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
                              <ResizableHandle
                                withHandle
                                className="bg-border/40"
                              />
                              <ResizablePanel
                                defaultSize={horizontalSplit ? 50 : undefined}
                                collapsible={false}
                                className={
                                  mobileSplit
                                    ? "flex items-center justify-center p-4 bg-background"
                                    : ""
                                }
                              >
                                {mobileSplit ? (
                                  <div className="relative mx-auto h-[852px] w-[393px] flex-shrink-0 overflow-hidden rounded-[40px] border-[10px] border-black bg-black shadow-xl ring-1 ring-gray-500/30">
                                    <div className="absolute top-0 left-0 right-0 h-[44px] bg-black px-6 flex items-center justify-between text-white text-xs z-10">
                                      <div>1:10</div>
                                      <div className="absolute left-1/2 -translate-x-1/2 h-[25px] w-[95px] bg-black rounded-[20px] flex items-center justify-center mt-1">
                                        <div className="h-[4px] w-[4px] rounded-full bg-green-500"></div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div>5G</div>
                                        <div>100%</div>
                                      </div>
                                    </div>
                                    <div className="h-full w-full overflow-hidden rounded-[30px]">
                                      <div className="flex h-full flex-col">
                                        <div className="h-[44px]"></div>
                                        <IFrameWrapper mobile>
                                          <></>
                                        </IFrameWrapper>
                                        <div className="flex flex-col bg-[#f2f2f7] border-t border-gray-200">
                                          <div className="flex items-center px-3 h-11 bg-[#f2f2f7] border-b border-gray-200">
                                            <div className="flex-1 px-2 py-1">
                                              <div className="bg-[#e1e1e6] rounded-lg h-8 flex items-center px-3 gap-2">
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  className="text-gray-400"
                                                >
                                                  <circle
                                                    cx="11"
                                                    cy="11"
                                                    r="8"
                                                  />
                                                  <path d="m21 21-4.3-4.3" />
                                                </svg>
                                                <span className="text-sm text-gray-400 flex-1 truncate">
                                                  next-go-production.up.railway.app
                                                </span>
                                              </div>
                                            </div>
                                            <button className="w-11 h-11 flex items-center justify-center text-blue-500">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="22"
                                                height="22"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <path d="M18 15v3H6v-3" />
                                                <path d="M12 3v12" />
                                                <path d="m17 8-5-5-5 5" />
                                              </svg>
                                            </button>
                                          </div>
                                          <div className="flex h-14 items-center justify-between px-4">
                                            <button className="flex flex-col items-center justify-center text-gray-500">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <path d="m9 10-5 5 5 5" />
                                                <path d="m20 4-5 5 5 5" />
                                              </svg>
                                            </button>
                                            <button className="flex flex-col items-center justify-center text-gray-500">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <path d="M15 18l-6-6 6-6" />
                                              </svg>
                                            </button>
                                            <button className="flex flex-col items-center justify-center text-gray-500">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <path d="M3 15v4c0 1.1.9 2 2 2h4M21 9V5c0-1.1-.9-2-2-2h-4m-8 0H5c-1.1 0-2 .9-2 2v4m18 0V5c0-1.1-.9-2-2-2h-4M21 15v4c0 1.1-.9 2-2 2h-4" />
                                              </svg>
                                            </button>
                                            <button className="flex flex-col items-center justify-center text-gray-500">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex h-full flex-col">
                                    <IFrameWrapper>
                                      <BetterToolbar />
                                      <DevtoolsOverlay />
                                    </IFrameWrapper>
                                  </div>
                                )}
                              </ResizablePanel>
                            </>
                          )}

                          {!horizontalSplit &&
                            !mobileSplit &&
                            devtoolsVisible && (
                              <>
                                <ResizableHandle
                                  withHandle
                                  className="bg-border/40"
                                />
                                <ResizablePanel
                                  defaultSize={30}
                                  collapsible={true}
                                  className="relative"
                                >
                                  <div className="flex h-full flex-col border-t border-zinc-800/80">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full hover:bg-background/80"
                                      onClick={() =>
                                        toggleSidebar("chat", "left")
                                      }
                                      disabled={isAnimating}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                    <DevTools
                                      onClose={() =>
                                        toggleSidebar("chat", "left")
                                      }
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
                    </ResizablePanelGroup>
                  </div>

                  <AnimatePresence mode="wait">
                    {rightSidebar.component && (
                      <motion.div
                        key={`right-sidebar-${rightSidebar.component}`}
                        initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                        animate={{
                          width:
                            rightSidebar.component === "chat" ? "25%" : "16%",
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
                        className="h-full flex-shrink-0 border-l  overflow-hidden"
                        style={{ minWidth: 0 }}
                      >
                        {rightSidebar.component === "chat" ? (
                          <div className="relative flex h-full flex-col">
                            <Chat
                              onCloseChat={() => toggleSidebar("chat", "right")}
                            />
                          </div>
                        ) : rightSidebar.component === "websiteTree" ? (
                          <ProjectsSidebar onNuke={() => {}} />
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
            </>
          )}
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

  const createProjectMutation = trpc.daemon.createProject.useMutation({
    meta: {
      noInvalidate: true,
    },
  });
  const iframe = useChatStore((state) => state.iframe);
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const project = projects.at(0);
  useLayoutEffect(() => {
    if (project && !iframe.state.url && project.status === "running") {
      iframe.actions.setInspectorState({
        url: `http://localhost:${project.port}`, // totally redundant
        project,
        // project: newProject,
      });
    }
  }, []);

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
  const context = useChatStore((state) => state.context);
  // fuck it
  const replay = useWS<any>({
    url: "http://localhost:6969",
    projectName: project?.name,
    onMessage: (message: { action: "video"; url: string }) => {
      if (message.action !== "video") {
        return;
      }

      navigator.clipboard.writeText(message.url);

      // Create a toast notification with a green check mark
      const toast = document.createElement("div");
      toast.style.position = "fixed";
      toast.style.bottom = "20px";
      toast.style.right = "20px";
      toast.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      toast.style.color = "#fff";
      toast.style.padding = "10px 15px";
      toast.style.borderRadius = "4px";
      toast.style.display = "flex";
      toast.style.alignItems = "center";
      toast.style.zIndex = "9999";
      toast.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
      toast.style.transition = "opacity 0.3s ease-in-out";
      toast.style.cursor = "pointer";

      const checkIcon = document.createElement("span");
      checkIcon.innerHTML = "✓";
      checkIcon.style.color = "#4ade80";
      checkIcon.style.marginRight = "8px";
      checkIcon.style.fontSize = "18px";

      const text = document.createElement("span");
      text.textContent = "Copied to clipboard";
      text.style.fontSize = "14px";

      toast.appendChild(checkIcon);
      toast.appendChild(text);

      toast.addEventListener("click", () => {
        window.open(message.url, "_blank");
      });

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 2000);

      console.log("replay message", message);
    },
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ChildToParentMessage>) => {
      switch (event.data.kind) {
        case "rrweb-event": {
          console.log("got event", event.data.event);

          replay.socket?.emit("message", {
            kind: "event",
            event: event.data.event,
          });
          return;
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [replay.socket]);
  // const devtoolsRequesct = useMakeRequest();
  const message = useIFrameMessenger();

  const items = [
    ...getCommandItems({
      onStartReplay: async () => {
        // replay.socket?.emit("message", {
        //   kind: "create-recording",
        // });

        const res = await message({
          kind: "start-recording",
          id: nanoid(),
          responsePossible: true,
        });

        console.log("yippy skippy start recording", res);
      },
      ...toolbarState,
      // onStartRecording: () => {

      // },
      onCreateReplay: () => {
        replay.socket?.emit("message", {
          kind: "create-recording",
        });
        /**
         * await get recording
         * await recording to mp4
         * that's it, i should have a replay preview component that polls for
         * callback status + with retry to determine state of video
         *
         * we will wait the upload on the model side too, just like chatgpt does
         * when I upload a photo and hit send, objectively the best UX, that
         * upload sometime takes long af lol
         *
         * i love ado
         *
         *
         */
      },
      inspector,
      createProjectLoading: false,
      onCreateProject: async () => {
        const newProject = await createProjectMutation.mutateAsync();
        utils.daemon.getProjects.setData(undefined, (prev) =>
          !prev ? [newProject] : [...prev, newProject],
        );
        utils.project.getEvents.prefetch({ projectName: newProject.name });

        const checkUrlReady = () => {
          const hiddenIframe = document.createElement("iframe");

          hiddenIframe.style.display = "none";
          hiddenIframe.src = `http://localhost:${newProject.port}`;

          hiddenIframe.onload = () => {
            setTimeout(() => {
              iframe.actions.setInspectorState({
                url: `http://localhost:${newProject.port}`,
                project: newProject,
              });
            }, 20);
            if (document.documentElement.contains(hiddenIframe)) {
              document.documentElement.removeChild(hiddenIframe);
            }
          };

          hiddenIframe.onerror = () => {
            if (document.documentElement.contains(hiddenIframe)) {
              document.documentElement.removeChild(hiddenIframe);
            }
            setTimeout(checkUrlReady, 10);
          };

          document.documentElement.appendChild(hiddenIframe);
        };

        checkUrlReady();

        // iframe.actions.setInspectorState({
        //   url: `http://localhost:${newProject.port}`,
        // });
      },
    }),
    ...additionalCommands,
  ];

  return <CommandPalette items={items} />;
};
