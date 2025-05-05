"use client";

import { Edit2Icon, ImageIcon } from "lucide-react";
import { Button } from "src/components/ui/button";
// import { pluginRPC } from "../rpc";
import { trpc } from "src/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import { useUploadBackgroundImage } from "./hooks";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "src/components/ui/context-menu";
import { Project } from "zenbu-daemon";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
// import router from "next/router";

function ProjectCard({
  project,
  style = {},
}: {
  project: Project & { url: string | null };
  style?: React.CSSProperties;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.name });

  const cardStyle: React.CSSProperties = {
    ...style,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : style.transform,
    transition,
    opacity: isDragging ? 0.3 : (style.opacity ?? 1),
  };
  const router = useRouter();

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={cardStyle}
          className="bg-background rounded-lg shadow-lg flex flex-col min-w-[256px] w-fit"
        >
          <div
            {...listeners}
            {...attributes}
            className="p-2 border-b flex items-center justify-between cursor-move"
          >
            <h3 className="font-medium text-sm">{project.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                // router.push(`/editor/${project.name}`);
                // todo: swap over ui when ready
                router.push("/");
              }}
            >
              <Edit2Icon className="h-4 w-4" />
            </Button>
          </div>
          {project.url && (
            <div className="w-[256px] h-[160px] overflow-hidden relative">
              <iframe
                src={project.url}
                className="absolute top-0 left-0 w-[512px] h-[320px] pointer-events-none"
                style={{ transform: "scale(0.5)", transformOrigin: "top left" }}
              />
            </div>
          )}
          {!project.url && (
            <div className="w-[256px] h-[160px] flex items-center justify-center bg-muted">
              Project not running
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={() => {
            router.push(`/editor/${project.name}`);
          }}
        >
          Open in Real Editor
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function Page() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const uploadBackgroundImage = useUploadBackgroundImage();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const workspaces = ["home", "work", "games", "reproductions", "reusable", "os", "productivity", "devtools", "packages"];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const [items, setItems] = useState<string[]>([]);

  const [[projects, workspace]] = trpc.useSuspenseQueries((t) => [
    t.daemon.getProjects(),
    t.workspace.getWorkspace({ workspaceId }),
  ]);

  const projectsWithUrl = projects
    .map((project) => ({
      ...project,
      url:
        project.status === "running"
          ? `http://localhost:${project.port}`
          : null,
    }))
    .slice(0, 3);

  useEffect(() => {
    const names = projectsWithUrl.map((p) => p.name);
    setItems((prev) => {
      if (
        prev.length === names.length &&
        prev.every((n, i) => n === names[i])
      ) {
        return prev;
      }
      return names;
    });
  }, [projects]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          backgroundImage: workspace.backgroundImageUrl
            ? `url(${workspace.backgroundImageUrl})`
            : "",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="h-[100vh] w-[100vw] relative py-2"
      >
        <div className="flex bg-black rounded-lg w-fit mx-4">
          {workspaces.map((name) => (
            <Button
              key={name}
              variant="ghost"
              onClick={() => {
                if (name !== workspaceId) {
                  router.push(`/${name}`);
                }
              }}
              className={`rounded-none h-8 px-4 ${
                name === workspaceId
                  ? name === "home"
                    ? "text-blue-400"
                    : name === "work"
                      ? "text-orange-400"
                      : "text-green-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {name}
            </Button>
          ))}
        </div>

        <Button
          onClick={async () => {
            uploadBackgroundImage.upload();
          }}
          className="absolute top-2 right-2"
          variant={"ghost"}
        >
          <ImageIcon />
        </Button>

        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div
            className="flex flex-col gap-4 p-4 w-fit"
          >
            {items.map((id) => {
              const project = projectsWithUrl.find((p) => p.name === id)!;
              const dimStyle = activeId === id ? { opacity: 0 } : {};
              return (
                <ProjectCard
                  key={project.name}
                  project={project}
                  style={dimStyle}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <ProjectCard
              project={projectsWithUrl.find((p) => p.name === activeId)!}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
