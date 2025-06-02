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
      <div className="w-12 h-full flex flex-col items-center self-start pt-4 border-l gap-y-1.5">
        <Button
          onClick={() => {
            // startTransition(() => {
            flushSync(() => {
              router.push(`/${workspaceId}`);
            });
            // });
          }}
          variant="ghost"
          className={cn("h-12 w-12 hover:bg-background ")}
        >
          <ArrowLeft size={20} />
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
            "h-12 w-12 hover:bg-background",
            sidebar.left === "projects"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/5",
          )}
        >
          <FolderIcon size={20} />
        </Button>
        <Button
          onClick={() => {
            startTransition(() => {
              sidebar.setLeftSidebarRoute(
                sidebar.left === "chat" ? null : "chat",
              );
              // sidebar.setRightSidebarRoute(
              //   sidebar.right === "chat" ? null : "chat",
              // );
            });
          }}
          variant="ghost"
          className={cn(
            "h-12 w-12 hover:bg-background",
            sidebar.right === "chat" && "bg-accent text-accent-foreground ",
          )}
        >
          <MessageSquareIcon size={20} />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12 hover:bg-background",
                state.drawing.active && "bg-accent text-accent-foreground ",
              )}
              onClick={() => {
                actions.setIsDrawing(!state.drawing.active);
              }}
            >
              <Pencil size={20} />
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
                "h-12 w-12 hover:bg-background",
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
              <Inspect size={20} />
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
                "h-12 w-12 hover:bg-background",
                state.screenshotting.active &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={() => {
                actions.setIsScreenshotting(!state.screenshotting.active);
              }}
            >
              <CameraIcon size={20} />
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
                "h-12 w-12 hover:bg-background",
                state.recording.active && "bg-accent text-accent-foreground ",
              )}
              onClick={() => {
                actions.setIsRecording(!state.recording.active);
              }}
            >
              <VideoIcon size={20} />
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
                "h-12 w-12 hover:bg-background",
                state.mobileSplit.active && "bg-accent text-accent-foreground ",
              )}
              onClick={() => {
                actions.setMobileSplitActive(!state.recording.active);
              }}
            >
              <MonitorSmartphoneIcon size={20} />
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
                "h-12 w-12 hover:bg-background",
                // state.mobileSplit.active && "bg-accent text-accent-foreground ",
              )}
              onClick={() => {
                // actions.setMobileSplitActive(!state.recording.active);
              }}
            >
              <TerminalIcon size={20} />
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
