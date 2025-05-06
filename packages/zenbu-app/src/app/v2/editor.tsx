"use client";
import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  unstable_ViewTransition as ViewTransition,
} from "react";
import { trpc } from "src/lib/trpc";
import { Project } from "zenbu-daemon";
import {
  useSidebarRouterInit,
  ProjectContext,
  SidebarRouterContext,
  useSidebarRouter,
} from "./context";
import { Preview } from "./preview";
import { LeftSidebar } from "./left-sidebar";
import { SlimSidebar } from "./slim-sidebar";
import { useThumbnailScaleCalc } from "../[workspaceId]/hooks";
import { RightSidebar } from "./right-sidebar";
import {
  ChatInstanceContext,
  useChatStore,
  useTransitionChatStore,
} from "src/components/chat-store";
import { IFrameWrapper } from "../iframe-wrapper";
import { DevtoolsOverlay } from "src/components/devtools-overlay";
import { Recording } from "src/components/recording";
import { BetterToolbar } from "src/components/slices/better-toolbar";
import { BetterDrawing } from "../editor/[projectName]/better-drawing";
import { ScreenshotTool } from "../editor/[projectName]/screenshot-tool";
import AppSwitcher from "src/components/option-tab-switcher";
import { CommandMenu } from "./command-menu";
import { MessageSquareIcon } from "lucide-react";
import { CommandPalette } from "src/components/command-palette";
import { CommandWrapper } from "../editor/[projectName]/command-wrapper";
import dynamic from "next/dynamic";
// import { BottomPanel } from "./bottom-panel";
const BottomPanel = dynamic(() => import("src/app/v2/bottom-panel"), {
  ssr: false,
});

export const Editor = () => {
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const runningProjects = useMemo(
    () => projects.filter((project) => project.status === "running"),
    [projects],
  );

  const { measuredSize, previewContainerRef } = useThumbnailScaleCalc();

  const initialProject = runningProjects.at(0);
  if (!initialProject) {
    throw new Error("todo: enforce this invariant somewhere else");
  }

  const sidebarRouteState = useSidebarRouterInit();

  if (!initialProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        No running projects found. Start one to continue.
      </div>
    );
  }

  const [open, setOpen] = useState(false);

  return (
    // <ProjectContext.Provider
    //   value={{ project: currentProject, setProject: setCurrentProject }}
    // >
    <ChatInstanceContext.Provider
      initialValue={{
        iframe: {
          project: initialProject,
          url:
            initialProject.status === "running"
              ? `http://localhost:${initialProject.port}`
              : null!,
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
      <SidebarRouterContext.Provider value={sidebarRouteState}>
        <AppSwitcherWrapper />
        <CommandMenu
          items={[{ icon: <MessageSquareIcon />, name: "Chat" }]}
          open={open}
          setOpen={setOpen}
        />

        <div className="h-[99vh] w-[99vw] rounded-lg flex bg-background border-4 border-black">
          <SlimSidebar />
          {/* uh why isn't this working :/ */}
          <ViewTransition update="none">
            <LeftSidebar
              allProjects={runningProjects}
              measuredSize={measuredSize}
            />
          </ViewTransition>
          <div
            ref={previewContainerRef}
            className="flex flex-col w-full items-center justify-center overflow-hidden"
          >
            <IFrameWrapper>
              <ScreenshotTool />
              <BetterToolbar />
              <DevtoolsOverlay />
              <BetterDrawing />
              <Recording />
            </IFrameWrapper>
            <BottomPanel
        
            />
          </div>
          <RightSidebar />
        </div>
      </SidebarRouterContext.Provider>
    </ChatInstanceContext.Provider>
  );
};

const AppSwitcherWrapper = () => {
  const iframeActions = useTransitionChatStore((state) => state.iframe.actions);

  return (
    <AppSwitcher
      setProject={(project) => {
        iframeActions.setState({ project });
      }}
    />
  );
};
