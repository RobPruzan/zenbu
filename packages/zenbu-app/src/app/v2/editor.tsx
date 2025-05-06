"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import { trpc } from "src/lib/trpc";
import { Project } from "zenbu-daemon";
import {
  useSidebarRouterInit,
  ProjectContext,
  SidebarRouterContext,
} from "./context";
import { Preview } from "./preview";
import { LeftSidebar } from "./left-sidebar";
import { SlimSidebar } from "./slim-sidebar";
import { useThumbnailScaleCalc } from "../[workspaceId]/hooks";
import { RightSidebar } from "./right-sidebar";
import { ChatInstanceContext } from "src/components/chat-store";
import { IFrameWrapper } from "../iframe-wrapper";
import { DevtoolsOverlay } from "src/components/devtools-overlay";
import { Recording } from "src/components/recording";
import { BetterToolbar } from "src/components/slices/better-toolbar";
import { BetterDrawing } from "../editor/[projectName]/better-drawing";
import { ScreenshotTool } from "../editor/[projectName]/screenshot-tool";

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
  const [currentProject, setCurrentProject] = useState<Project>(initialProject);

  const sidebarRouteState = useSidebarRouterInit();

  if (!currentProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        No running projects found. Start one to continue.
      </div>
    );
  }

  return (
    // <ProjectContext.Provider
    //   value={{ project: currentProject, setProject: setCurrentProject }}
    // >
    <ChatInstanceContext.Provider
      initialValue={{
        iframe: {
          project: currentProject,
          url:
            currentProject.status === "running"
              ? `http://localhost:${currentProject.port}`
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
        <div className="h-screen w-screen flex bg-background text-foreground">
          <SlimSidebar />
          <LeftSidebar
            allProjects={runningProjects}
            measuredSize={measuredSize}
          />
          <div
            ref={previewContainerRef}
            className="flex-1 flex items-center justify-center overflow-hidden"
          >
            <IFrameWrapper>
              <ScreenshotTool />
              <BetterToolbar />
              <DevtoolsOverlay />
              <BetterDrawing />
              <Recording />
            </IFrameWrapper>
          </div>
          <RightSidebar />
        </div>
      </SidebarRouterContext.Provider>
    </ChatInstanceContext.Provider>
  );
};
