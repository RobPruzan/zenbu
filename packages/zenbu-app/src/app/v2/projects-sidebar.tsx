import { Project } from "zenbu-daemon";
import { InactiveProjectPreview } from "./inactive-project-preview";
import { Button } from "src/components/ui/button";
import { trpc } from "src/lib/trpc";
import { PlusCircleIcon, TrashIcon } from "lucide-react";

export const ProjectsSidebar = ({
  inactiveProjects,
  measuredSize,
}: {
  inactiveProjects: Project[];
  measuredSize: { width: number | null; height: number | null };
}) => {
  const createProjectMutation = trpc.daemon.createProject.useMutation();
  const nukeMutation = trpc.daemon.nuke.useMutation();
  return (
    <div className="flex flex-col gap-4 self-start pt-4 px-2 w-[calc(160px+1rem)] bg-gradient-to-b from-black to-zinc-950 h-full border-r">
      <div className="flex justify-evenly">
        <Button
          variant={"ghost"}
          size={"sm"}
          onClick={() => {
            createProjectMutation.mutate();
          }}
        >
          <PlusCircleIcon />
        </Button>
        <Button
          variant={"ghost"}
          size={"sm"}
          onClick={() => {
            nukeMutation.mutate();
          }}
        >
          <TrashIcon />
        </Button>
      </div>
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
