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
    <ProjectContext.Provider
      value={{ project: currentProject, setProject: setCurrentProject }}
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
            <Preview />
          </div>
        </div>
      </SidebarRouterContext.Provider>
    </ProjectContext.Provider>
  );
};
