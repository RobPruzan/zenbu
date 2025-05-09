import { SkullIcon } from "lucide-react";
import {
  useContext,
  useMemo,
  startTransition,
  unstable_ViewTransition as ViewTransition,
  useState,
  useEffect,
} from "react";
import { Project } from "zenbu-daemon";
import { ProjectContext } from "./context";
import { THUMBNAIL_WIDTH_PX, useThumbnailDim } from "../[workspaceId]/hooks";
import { height } from "tailwindcss/defaultTheme";
import { useChatStore } from "src/components/chat-store";
import { useAppSwitcherState } from "src/components/app-switcher-context";
import { cn } from "src/lib/utils";

export const InactiveProjectPreview = ({
  project,
  measuredSize,
}: {
  project: Project;
  measuredSize: { width: number | null; height: number | null };
}) => {
  const { notifyProjectChange } = useAppSwitcherState();
  const iframeActions = useChatStore((state) => state.iframe.actions);
  const toolbarActions = useChatStore((state) => state.toolbar.actions);

  const { iframeH, iframeW, thumbnailContainerHeight } = useThumbnailDim({
    measuredSize,
  });
  const inspector = useChatStore((state) => state.inspector);

  if (project.status !== "running") {
    return (
      <div
        style={{
          width: `${THUMBNAIL_WIDTH_PX}px`,
          height: `${thumbnailContainerHeight}px`,
        }}
        className="flex items-center justify-center bg-muted/10 border border-border/40"
        title={`${project.name} (not running)`}
      >
        <SkullIcon className="text-muted-foreground" size={24} />
      </div>
    );
  }

  const [showBorder, setShowBorder] = useState(false);

  useEffect(() => {
    setShowBorder(true);
  }, []);

  return (
    <ViewTransition share="stage-manager-anim" name={`preview-${project.name}`}>
      <div
        onClick={() => {
          startTransition(() => {
            toolbarActions.setIsDrawing(false);
            notifyProjectChange(project.name);
            inspector.actions.setInspectorState({
              kind:
                inspector.state.kind === "inspecting" ? "off" : "inspecting",
            });
            iframeActions.setState({
              project,
            });
          });
        }}
        data-border={showBorder ? "true" : "false"}
        style={{
          width: `${THUMBNAIL_WIDTH_PX}px`,
          height: `${thumbnailContainerHeight}px`,
        }}
        className={cn([
          "overflow-hidden cursor-pointer  bg-black/50 relative rounded-lg transition-border",
          // showBorder && "border border-border/50",
        ])}
        title={`Switch to ${project.name}`}
      >
        <iframe
          src={`http://localhost:${project.port}`}
          title={`${project.name} (thumbnail)`}
          style={{
            width: `${iframeW}px`,
            height: `${iframeH}px`,
            transform: `scale(var(--thumbnail-scale))`,
            transformOrigin: "top left",
          }}
          className="border pointer-events-none absolute top-0 left-0"
        />
      </div>
    </ViewTransition>
  );
};
