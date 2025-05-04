import { useContext, useMemo } from "react";
import { Project } from "zenbu-daemon";
import { useSidebarRouter, ProjectContext } from "./context";
import { ProjectsSidebar } from "./projects-sidebar";

export const LeftSidebar = ({
  allProjects,
  measuredSize,
}: {
  allProjects: Project[];
  measuredSize: { width: number | null; height: number | null };
}) => {
  const sidebar = useSidebarRouter();
  const { project: activeProject } = useContext(ProjectContext);

  if (!sidebar.left) return null;

  const inactiveProjects = useMemo(
    () => allProjects.filter((p) => p.name !== activeProject?.name),
    [allProjects, activeProject],
  );

  switch (sidebar.left) {
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
    default:
      return null;
  }
};