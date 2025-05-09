import {
  Loader2,
  PlusCircle,
  RadiationIcon,
  Trash2,
  Play,
  Pause,
  Terminal,
} from "lucide-react";
import {
  startTransition,
  unstable_ViewTransition as ViewTransition,
} from "react";
import {
  useChatStore,
  useTransitionChatStore,
} from "src/components/chat-store";
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
import { flushSync } from "react-dom";
import { useParams } from "next/navigation";

export const ProjectsSidebar = ({ onNuke }: { onNuke: () => void }) => {
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const createProjectMutation = trpc.daemon.createProject.useMutation();
  const nukeMutation = trpc.daemon.nuke.useMutation();

  const { workspaceId } = useParams<{ workspaceId: string }>();
  const iframeActions = useChatStore((state) => state.iframe.actions);
  const project = useTransitionChatStore((state) => state.iframe.state.project);

  const inactiveProjects = projects.filter((p) => p.name !== project.name);
  const activeProject = projects.find((p) => p.name === project.name);

  if (!activeProject) {
    throw new Error("invariant");
  }

  return (
    <TooltipProvider>
      <div className="w-full flex flex-col items-center">
        <div className="px-2 py-1.5 border-b flex items-center justify-between">
          <h2 className="text-xs font-medium px-1">Projects</h2>
          <div className="flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() =>
                    createProjectMutation.mutate({
                      workspaceId,
                    })
                  }
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

        <div className="flex-1 overflow-auto py-1 gap-y-3 flex flex-col">
          {inactiveProjects
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((project) => (
              <ProjectButton key={project.name} project={project} />
            ))}
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

      iframe.actions.setState({
        url: `http://localhost:${startedProject.port}`,
        project: startedProject,
      });
    } else {
      iframe.actions.setState({
        url: projectUrl!,
        project,
      });
    }
  };

  if (project.status !== "running") {
    return;
  }

  return (
    <ViewTransition name={`window-${project.name}`}>
      <div
        onClick={() => {
          startTransition(() => {
            flushSync(() => {
              iframe.actions.setState({
                url: projectUrl!,
                project,
              });
            });
          });
        }}
        className="w-40 h-32 rounded-lg overflow-hidden cursor-pointer border border-border/70 hover:border-border transition-all bg-black/50"
      >
        <iframe
          // title={`${window.title} (thumbnail)`}
          src={`http://localhost:${project.port}`}
          // srcDoc={getIframeContent(window.title)}
          className="w-[600px] h-[400px] border-0 scale-[calc(4/15)] origin-top-left pointer-events-none"
        />
      </div>
    </ViewTransition>
    // <div className="px-1">
    //   <div
    //     onMouseOver={() => {
    //       utils.project.getEvents.prefetch({ projectName: project.name });
    //     }}
    //     onClick={handleProjectClick}
    //     className={cn(
    //       "w-full flex items-center gap-2 rounded-md px-2 py-1.5 group relative text-left cursor-pointer",
    //       "transition-all duration-200",
    //       isActive
    //         ? "bg-sidebar-accent text-sidebar-accent-foreground"
    //         : "hover:bg-sidebar-accent/50",
    //       isKilled && "opacity-75",
    //     )}
    //   >
    //     <div className="flex-1 flex items-center gap-2 min-w-0 text-sm">
    //       <div className="flex items-center gap-2 flex-1 min-w-0">
    //         <div className="relative flex items-center justify-center w-3">
    //           <div
    //             className={cn(
    //               "h-1.5 w-1.5 rounded-full transition-colors duration-200",
    //               isActive
    //                 ? "bg-sidebar-accent-foreground"
    //                 : isRunning
    //                   ? "bg-green-500"
    //                   : "bg-muted-foreground/30",
    //             )}
    //           />
    //         </div>
    //         <span className="truncate font-medium">{project.name}</span>
    //       </div>
    //     </div>

    //     <div
    //       className={cn(
    //         "flex items-center gap-0.5",
    //         !isActive && "opacity-0 group-hover:opacity-100 transition-opacity",
    //       )}
    //     >
    //       {isRunning ? (
    //         <Button
    //           size="icon"
    //           variant="ghost"
    //           className="h-6 w-6"
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             killProjectMutation.mutate({ name: project.name });
    //           }}
    //           disabled={killProjectMutation.isPending}
    //           title="Stop Project"
    //         >
    //           {killProjectMutation.isPending ? (
    //             <Loader2 className="h-3 w-3 animate-spin" />
    //           ) : (
    //             <Pause className="h-3 w-3" />
    //           )}
    //         </Button>
    //       ) : (
    //         <Button
    //           size="icon"
    //           variant="ghost"
    //           className="h-6 w-6"
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             startProjectMutation.mutate({ name: project.name });
    //           }}
    //           disabled={startProjectMutation.isPending}
    //           title="Start Project"
    //         >
    //           {startProjectMutation.isPending ? (
    //             <Loader2 className="h-3 w-3 animate-spin" />
    //           ) : (
    //             <Play className="h-3 w-3" />
    //           )}
    //         </Button>
    //       )}

    //       <Button
    //         size="icon"
    //         variant="ghost"
    //         className="h-6 w-6"
    //         onClick={(e) => {
    //           e.stopPropagation();
    //           deleteProjectMutation.mutate({ name: project.name });
    //         }}
    //         disabled={deleteProjectMutation.isPending}
    //         title="Delete Project"
    //       >
    //         {deleteProjectMutation.isPending ? (
    //           <Loader2 className="h-3 w-3 animate-spin" />
    //         ) : (
    //           <Trash2 className="h-3 w-3" />
    //         )}
    //       </Button>
    //     </div>
    //   </div>
    // </div>
  );
};
