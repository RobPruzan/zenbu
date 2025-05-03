import {
  Loader2,
  PlusCircle,
  RadiationIcon,
  Trash2,
  Play,
  Pause,
  Terminal,
} from "lucide-react";
import { useChatStore } from "src/components/chat-store";
import { Button } from "src/components/ui/button";
import { trpc } from "src/lib/trpc";
import { cn } from "src/lib/utils";
import { Project } from "zenbu-daemon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "src/components/ui/tooltip";

export const ProjectsSidebar = ({ onNuke }: { onNuke: () => void }) => {
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const createProjectMutation = trpc.daemon.createProject.useMutation();
  const nukeMutation = trpc.daemon.nuke.useMutation();

  return (
    <TooltipProvider>
      <div className="w-full flex flex-col">
        <div className="px-2 py-1.5 border-b flex items-center justify-between">
          <h2 className="text-xs font-medium px-1">Projects</h2>
          <div className="flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => createProjectMutation.mutate()}
                >
                  {createProjectMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <PlusCircle className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create Project</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => {
                    onNuke();
                    nukeMutation.mutate();
                  }}
                >
                  {nukeMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RadiationIcon className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset All Projects</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-1">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
              <Terminal className="h-8 w-8 mb-2 opacity-50" />
              <p>No projects yet</p>
              <p className="text-xs">Create one to get started</p>
            </div>
          ) : (
            projects
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((project) => (
                <ProjectButton key={project.name} project={project} />
              ))
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export const ProjectButton = ({ project }: { project: Project }) => {
  const iframe = useChatStore((state) => state.iframe);
  const startProjectMutation = trpc.daemon.startProject.useMutation();
  const killProjectMutation = trpc.daemon.killProject.useMutation();
  const deleteProjectMutation = trpc.daemon.deleteProject.useMutation();

  const isKilled = project.status === "killed";
  const isRunning = !isKilled;

  // Check if this project is currently active by comparing URLs
  const currentUrl = iframe.state.url;
  const utils = trpc.useUtils();
  const projectUrl = isKilled
    ? null
    : `http://localhost:${(project as any).port}`;
  const isActive = !isKilled && currentUrl === projectUrl;

  const handleProjectClick = async () => {
    if (isKilled) {
      const startedProject = await startProjectMutation.mutateAsync({
        name: project.name,
      });

      iframe.actions.setInspectorState({
        url: `http://localhost:${startedProject.port}`,
        project: startedProject,
      });
    } else {
      iframe.actions.setInspectorState({
        url: projectUrl!,
        project,
      });
    }
  };

  return (
    <div className="px-1">
      <div
        onMouseOver={() => {
          utils.project.getEvents.prefetch({ projectName: project.name });
        }}
        onClick={handleProjectClick}
        className={cn(
          "w-full flex items-center gap-2 rounded-md px-2 py-1.5 group relative text-left cursor-pointer",
          "transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent/50",
          isKilled && "opacity-75",
        )}
      >
        <div className="flex-1 flex items-center gap-2 min-w-0 text-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex items-center justify-center w-3">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors duration-200",
                  isActive
                    ? "bg-sidebar-accent-foreground"
                    : isRunning
                      ? "bg-green-500"
                      : "bg-muted-foreground/30",
                )}
              />
            </div>
            <span className="truncate font-medium">{project.name}</span>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-0.5",
            !isActive && "opacity-0 group-hover:opacity-100 transition-opacity",
          )}
        >
          {isRunning ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                killProjectMutation.mutate({ name: project.name });
              }}
              disabled={killProjectMutation.isPending}
              title="Stop Project"
            >
              {killProjectMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Pause className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                startProjectMutation.mutate({ name: project.name });
              }}
              disabled={startProjectMutation.isPending}
              title="Start Project"
            >
              {startProjectMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              deleteProjectMutation.mutate({ name: project.name });
            }}
            disabled={deleteProjectMutation.isPending}
            title="Delete Project"
          >
            {deleteProjectMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
