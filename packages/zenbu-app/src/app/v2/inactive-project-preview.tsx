import { SkullIcon } from "lucide-react";
import {
  useContext,
  useMemo,
  startTransition,
  unstable_ViewTransition as ViewTransition,
} from "react";
import { Project } from "zenbu-daemon";
import { ProjectContext } from "./context";
import { THUMBNAIL_WIDTH_PX, useThumbnailDim } from "../[workspaceId]/hooks";
import { height } from "tailwindcss/defaultTheme";

export const InactiveProjectPreview = ({
  project,
  measuredSize,
}: {
  project: Project;
  measuredSize: { width: number | null; height: number | null };
}) => {
  const { setProject } = useContext(ProjectContext);

  const { iframeH, iframeW, thumbnailContainerHeight } = useThumbnailDim({
    measuredSize,
  });

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

  return (
    <ViewTransition share="stage-manager-anim" name={`preview-${project.name}`}>
      <div
        onClick={() => {
          startTransition(() => {
            setProject(project);
          });
        }}
        style={{
          width: `${THUMBNAIL_WIDTH_PX}px`,
          height: `${thumbnailContainerHeight}px`,
        }}
        className="overflow-hidden cursor-pointer  bg-black/50 relative rounded-lg"
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
