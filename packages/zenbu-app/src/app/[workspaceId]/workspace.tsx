import { ImageIcon, PlusCircleIcon } from "lucide-react";
import { Button } from "src/components/ui/button";
import { trpc } from "src/lib/trpc";
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
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import Link from "next/link";
import { ProjectCard } from "./project-card";

export const Workspace = ({
  workspace,
}: {
  workspace: {
    workspaceId: string;
    backgroundImageUrl: string | null;
    createdAt: Date;
  };
}) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };
  const [items, setItems] = useState<string[]>([]);

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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );
  const [[projects]] = trpc.useSuspenseQueries((t) => [t.daemon.getProjects()]);
  const projectsWithUrl = projects
    .map((project) => ({
      ...project,
      url:
        project.status === "running"
          ? `http://localhost:${project.port}`
          : null,
    }))
    .slice(0, 3);

  // stupid model lol
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

  const uploadBackgroundImage = useUploadBackgroundImage();

  const createProjectMutation = trpc.daemon.createProject.useMutation();
  const workspaces = [
    "home",
    "work",
    "games",
    "reproductions",
    "reusable",
    "os",
    "productivity",
    "devtools",
    "packages",
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {" "}
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex items-center">
            <div className="flex bg-black rounded-md w-fit mx-4" style={{
                boxShadow: "0 3px 6px -2px rgba(0,0,0,0.2), 0 1px 3px -1px rgba(0,0,0,0.1), inset 0 1px 5px rgba(0,0,0,0.2)",
                background: "linear-gradient(135deg, #0a0a0a, #121212)"
              }}>
              {workspaces.map((name) => (
                <Link
                  key={name}
                  href={`/${name}`}
                  className={`inline-flex items-center text-sm justify-center rounded-none h-8 px-4 hover:bg-accent/50 ${
                    name === workspace.workspaceId
                      ? name === "home"
                        ? "text-blue-400"
                        : name === "work"
                          ? "text-orange-400"
                          : "text-green-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {name}
                </Link>
              ))}
            </div>
            <div className="flex bg-black rounded-md w-fit ml-auto mr-2" style={{
                boxShadow: "0 3px 6px -2px rgba(0,0,0,0.2), 0 1px 3px -1px rgba(0,0,0,0.1), inset 0 1px 5px rgba(0,0,0,0.2)",
                background: "linear-gradient(135deg, #0a0a0a, #121212)"
              }}>
              <Link
                href={"/marketplace"}
                className={`inline-flex items-center text-sm justify-center rounded-none h-8 px-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
              >
                personal marketplace
              </Link>
              <Button
                onClick={async () => {
                  uploadBackgroundImage.upload();
                }}
                className="inline-flex items-center text-sm justify-center rounded-none h-8 px-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <SortableContext items={items} strategy={rectSortingStrategy}>
            <div className="flex flex-col gap-4 p-4 w-fit">
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

              <Button
                variant={"ghost"}
                onClick={() => createProjectMutation.mutate()}
                className="w-fit flex items-center justify-center rounded-full"
              >
                <PlusCircleIcon className="h-12 w-12" />
              </Button>
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <ProjectCard
                project={projectsWithUrl.find((p) => p.name === activeId)!}
              />
            ) : null}
          </DragOverlay>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => createProjectMutation.mutate()}>
            Create App
          </ContextMenuItem>
          <ContextMenuItem onClick={() => createProjectMutation.mutate()}>
            Create Package
          </ContextMenuItem>
          <ContextMenuItem onClick={() => createProjectMutation.mutate()}>
            Create Model Tool
          </ContextMenuItem>
          <ContextMenuItem onClick={() => createProjectMutation.mutate()}>
            Create Editor Tool
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </DndContext>
  );
};
