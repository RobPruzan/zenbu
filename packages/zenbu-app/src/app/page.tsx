"use client";
import { FolderIcon, PlusIcon, SkullIcon, TrashIcon } from "lucide-react";
import { useParams } from "next/navigation";
import * as React from "react";
import {
  createContext,
  Dispatch,
  SetStateAction,
  startTransition,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  unstable_ViewTransition as ViewTransition,
} from "react";
import { ChatInstanceContext } from "src/components/chat-store";
import { Button } from "src/components/ui/button";
import { trpc } from "src/lib/trpc";
import { cn } from "src/lib/utils";
import { Project } from "zenbu-daemon";

const THUMBNAIL_WIDTH_PX = 160;

const ProjectContext = createContext<{
  project: Project;
  setProject: Dispatch<SetStateAction<Project>>;
}>(null!);

type LeftSidebarRoute = "projects" | "experiments";
type RightSidebarRoute = "chat";
const SidebarRouterContext = createContext<{
  left: LeftSidebarRoute | null;
  right: RightSidebarRoute | null;
  setRightSidebarRoute: (route: RightSidebarRoute | null) => void;
  setLeftSidebarRoute: (route: LeftSidebarRoute | null) => void;
}>(null!);

export const useSidebarRouter = () => useContext(SidebarRouterContext);

const useSidebarRouterInit = () => {
  const [left, setLeftSidebarRoute] = useState<LeftSidebarRoute | null>(
    "projects",
  );
  const [right, setRightSidebarRoute] = useState<RightSidebarRoute | null>(
    null,
  );
  return { left, right, setRightSidebarRoute, setLeftSidebarRoute };
};

export default function Page() {
  return <Editor />;
}

const Editor = () => {
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const runningProjects = useMemo(
    () => projects.filter((project) => project.status === "running"),
    [projects],
  );

  const initialProject = runningProjects.at(0);
  const [currentProject, setCurrentProject] = useState<Project | null>(
    initialProject ?? null,
  );

  const sidebarRouteState = useSidebarRouterInit();

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState<{
    width: number | null;
    height: number | null;
  }>({ width: null, height: null });

  const thumbnailScale = useMemo(() => {
    const width = measuredSize.width ?? 800;
    return THUMBNAIL_WIDTH_PX / width;
  }, [measuredSize.width]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setMeasuredSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    const currentRef = previewContainerRef.current;
    if (currentRef) {
      setMeasuredSize({
        width: currentRef.offsetWidth,
        height: currentRef.offsetHeight,
      });
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--thumbnail-scale",
      thumbnailScale.toString(),
    );
  }, [thumbnailScale]);

  if (!currentProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        No running projects found. Start one to continue.
      </div>
    );
  }

  return (
    <ProjectContext.Provider
      value={{ project: currentProject, setProject: setCurrentProject }}
    >
      <SidebarRouterContext.Provider value={sidebarRouteState}>
        <div className="h-screen w-screen flex bg-background text-foreground">
          <SlimSidebar />
          <LeftSidebar
            allProjects={runningProjects}
            measuredSize={measuredSize}
          />
          <div
            ref={previewContainerRef}
            className="flex-1 flex items-center justify-center overflow-hidden"
          >
            <Preview />
          </div>
        </div>
      </SidebarRouterContext.Provider>
    </ProjectContext.Provider>
  );
};

const Preview = React.forwardRef<HTMLDivElement>((props, ref) => {
  const { project } = useContext(ProjectContext);

  if (!project || project.status !== "running") {
    console.error("Preview rendered with invalid project state", project);
    return null;
  }

  return (
    <div className={`w-full h-full overflow-hidden relative bg-black/20 `}>
      <ViewTransition
        key={project.name}
        share="stage-manager-anim"
        name={`preview-${project.name}`}
      >
        <iframe
          className="w-full h-full absolute inset-0"
          src={`http://localhost:${project.port}`}
          title={project.name}
          sandbox="allow-scripts allow-same-origin"
        />
      </ViewTransition>
    </div>
  );
});
Preview.displayName = "Preview";

export const SlimSidebar = () => {
  const sidebar = useSidebarRouter();
  return (
    <div className="w-14 h-full flex flex-col self-start pt-4">
      <Button
        onClick={() => {
          sidebar.setLeftSidebarRoute(
            sidebar.left === "projects" ? null : "projects",
          );
        }}
        variant="ghost"
        className={`w-full h-10 flex items-center justify-center ${
          sidebar.left === "projects"
            ? "text-accent-foreground bg-accent/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
        }`}
      >
        <FolderIcon size={18} />
      </Button>
    </div>
  );
};

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

export const InactiveProjectPreview = ({
  project,
  measuredSize,
}: {
  project: Project;
  measuredSize: { width: number | null; height: number | null };
}) => {
  const { setProject } = useContext(ProjectContext);

  const measuredAspectRatio = useMemo(() => {
    const { width, height } = measuredSize;
    return width && height ? height / width : 2 / 3;
  }, [measuredSize]);

  const thumbnailContainerHeight = useMemo(
    () => THUMBNAIL_WIDTH_PX * measuredAspectRatio,
    [measuredAspectRatio],
  );

  const iframeW = measuredSize.width ?? 800;
  const iframeH = measuredSize.height ?? iframeW * measuredAspectRatio;

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
        className="overflow-hidden cursor-pointer  bg-black/50 relative"
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
