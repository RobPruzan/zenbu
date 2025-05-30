import { useContext, useMemo } from "react";
import { Project } from "zenbu-daemon";
import { useSidebarRouter, ProjectContext } from "./context";
import { ProjectsSidebar } from "./projects-sidebar";
import { iife } from "src/lib/utils";
import {
  useChatStore,
  useTransitionChatStore,
} from "src/components/chat-store";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedSidebar } from "./animated-sidebar";

export const LeftSidebar = ({
  allProjects,
  measuredSize,
}: {
  allProjects: Project[];
  measuredSize: { width: number | null; height: number | null };
}) => {
  const sidebar = useSidebarRouter();
  const activeProject = useTransitionChatStore(
    (state) => state.iframe.state.project,
  );

  // if (!sidebar.left) return null;

  const inactiveProjects = useMemo(
    () => allProjects.filter((p) => p.name !== activeProject?.name),
    [allProjects, activeProject],
  );

  return (
    <div className="w-fit">
      <AnimatedSidebar
        data={sidebar.left}
        renderSidebarContent={(left) => {
          switch (left) {
            case "experiments": {
              return (
                <div className="w-[200px] self-start pt-4 px-2 text-muted-foreground">
                  Experiments
                </div>
              );
            }
            case "projects": {
              return (
                <ProjectsSidebar
                  inactiveProjects={inactiveProjects}
                  measuredSize={measuredSize}
                />
              );
            }
          }
        }}
        width={"200px"}
      />
    </div>
  );
};
