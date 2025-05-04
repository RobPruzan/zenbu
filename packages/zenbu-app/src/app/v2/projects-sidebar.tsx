import { Project } from "zenbu-daemon";
import { InactiveProjectPreview } from "./inactive-project-preview";

export const ProjectsSidebar = ({
  inactiveProjects,
  measuredSize,
}: {
  inactiveProjects: Project[];
  measuredSize: { width: number | null; height: number | null };
}) => {
  return (
    <div className="flex flex-col gap-4 self-start pt-4 px-2 w-[calc(160px+1rem)] bg-[#000000] h-full border-r">
      {inactiveProjects.map((project, index) => (
        <InactiveProjectPreview
          key={`inactive-project-preview-${project.name}`}
          project={project}
          measuredSize={measuredSize}
        />
      ))}
    </div>
  );
};