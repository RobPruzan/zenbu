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
import { BetterDrawing } from "../sunset/[projectName]/better-drawing";
import { ScreenshotTool } from "../sunset/[projectName]/screenshot-tool";
import AppSwitcher from "src/components/option-tab-switcher";
import { CommandMenu } from "./command-menu";
import { MessageSquareIcon } from "lucide-react";
// import dynamic from "next/dynamic";
import { WithMobileSplit } from "./mobile-split";
// import { useRouter } from "next/router";
// const BottomPanel = dynamic(() => import("src/app/v2/bottom-panel"), {
//   ssr: false,
// });

export const Editor = ({
  // projectId,
  Container,
  defaultSidebarOpen,
}: {
  // projectId: string;
  Container?: ({ children }: { children: React.ReactNode }) => React.ReactNode;
  defaultSidebarOpen?: "chat";
}) => {
  // const {projectId} = useProjectContext()
  const [projectId] =
    trpc.persistedSingleton.getCurrentProjectId.useSuspenseQuery();
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const project = projects.find((project) => project.name === projectId);
  if (!project) {
    throw new Error("invariant, enforce earlier");
  }
  const runningProjects = useMemo(
    () => projects.filter((project) => project.status === "running"),
    [projects],
  );

  const { measuredSize, previewContainerRef } = useThumbnailScaleCalc();

  const sidebarRouteState = useSidebarRouterInit({ defaultSidebarOpen });

  const [open, setOpen] = useState(false);

  return (
    // <ProjectContext.Provider
    //   value={{ project: currentProject, setProject: setCurrentProject }}
    // >
    <ChatInstanceContext.Provider
      initialValue={{
        // iframe: {
        //   project: project,
        //   url:
        //     project.status === "running"
        //       ? `http://localhost:${project.port}`
        //       : null!,
        // },
        toolbar: {
          state: {
            mobileSplit: {
              active: false,
            },
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
        // eventLog: {
        //   events: [],
        // },
        chatControls: {
          input: "",
        },
      }}
    >
      <SidebarRouterContext.Provider value={sidebarRouteState}>
        {/* <AppSwitcherWrapper /> */}
        {/* <CommandMenu
          items={[{ icon: <MessageSquareIcon />, name: "Chat" }]}
          open={open}
          setOpen={setOpen}
        /> */}

        <div className="h-[100vh] w-[100vw] flex bg-background ">
          <LeftSidebar
            allProjects={runningProjects}
            measuredSize={measuredSize}
          />

          <div
            ref={previewContainerRef}
            className="flex flex-col w-full items-center justify-center overflow-hidden"
          >
            {/* 
            need an abstraction here thats a component to read context so we can split mobile and have the emulation

            along with the resizable
            
            */}
            <WithMobileSplit>
              <IFrameWrapper Container={Container}>
                <ScreenshotTool />
                <BetterToolbar />
                <DevtoolsOverlay />
                <BetterDrawing />
                <Recording />
              </IFrameWrapper>
            </WithMobileSplit>
            {/*  */}
            {/* <BottomPanel /> */}
          </div>
          <SlimSidebar />
          <RightSidebar />
          {/* <RightSidebar /> */}
        </div>
      </SidebarRouterContext.Provider>
    </ChatInstanceContext.Provider>
  );
};

// const AppSwitcherWrapper = () => {
//   const iframeActions = useTransitionChatStore((state) => state.iframe.actions);
//   const push = useRouter().push;

//   return (
//     <AppSwitcher
//       push={push}
//       setProject={(project) => {
//         iframeActions.setState({ project });
//       }}
//     />
//   );
// };
