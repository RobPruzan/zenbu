import {
  ArrowLeft,
  ArrowLeftSquareIcon,
  CameraIcon,
  FolderIcon,
  HomeIcon,
  Inspect,
  MessageSquareIcon,
  MonitorSmartphoneIcon,
  Pencil,
  TerminalIcon,
  VideoIcon,
} from "lucide-react";
import { Button } from "src/components/ui/button";
import { useSidebarRouter } from "./context";
import { useParams, useRouter } from "next/navigation";
import { cn } from "src/lib/utils";
import { startTransition } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "src/components/ui/tooltip";
import { useChatStore } from "src/components/chat-store";
import { flushSync } from "react-dom";

export const SlimSidebar = () => {
  const sidebar = useSidebarRouter();
  const router = useRouter();
  const { workspaceId } = useParams<{
    projectName: string;
    workspaceId: string;
  }>();
  const { actions, state } = useChatStore((state) => state.toolbar);
  const inspector = useChatStore((state) => state.inspector);
  return (
    <TooltipProvider>
      <div className="w-12 h-full flex flex-col items-center self-start pt-4 border-r gap-y-1.5">
        <Button
          onClick={() => {
            // startTransition(() => {
            flushSync(() => {
              router.push(`/${workspaceId}`);
            });
            // });
          }}
          variant="ghost"
          className={cn("h-8 w-8")}
        >
          <ArrowLeft size={18} />
        </Button>
        <Button
          onClick={() => {
            startTransition(() => {
              sidebar.setLeftSidebarRoute(
                sidebar.left === "projects" ? null : "projects",
              );
            });
          }}
          variant="ghost"
          className={cn(
            "h-8 w-8",
            sidebar.left === "projects"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/5",
          )}
        >
          <FolderIcon size={18} />
        </Button>
        <Button
          onClick={() => {
            startTransition(() => {
              sidebar.setRightSidebarRoute(
                sidebar.right === "chat" ? null : "chat",
              );
            });
          }}
          variant="ghost"
          className={cn(
            "h-8 w-8",
            sidebar.right === "chat" && "bg-accent text-accent-foreground",
          )}
        >
          <MessageSquareIcon size={18} />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.drawing.active && "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                actions.setIsDrawing(!state.drawing.active);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Drawing Tool</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                inspector.state.kind === "inspecting" &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                inspector.actions.setInspectorState({
                  kind:
                    inspector.state.kind === "inspecting"
                      ? "off"
                      : "inspecting",
                });
              }}
            >
              <Inspect className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Inspect Element</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.screenshotting.active &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                actions.setIsScreenshotting(!state.screenshotting.active);
              }}
            >
              <CameraIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Screenshot</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.recording.active && "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                actions.setIsRecording(!state.recording.active);
              }}
            >
              <VideoIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Record</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                state.mobileSplit.active && "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                actions.setMobileSplitActive(!state.recording.active);
              }}
            >
              <MonitorSmartphoneIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Mobile Split</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                // state.mobileSplit.active && "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                // actions.setMobileSplitActive(!state.recording.active);
              }}
            >
              <TerminalIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Terminal</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
