"use client";

import { Edit2Icon, ImageIcon, PlusCircleIcon } from "lucide-react";
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
import { startTransition, useEffect, useState } from "react";
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
import AppSwitcher from "src/components/option-tab-switcher";
import Link from "next/link";
import { ProjectCard } from "./project-card";
// import router from "next/router";

export default function Page() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const uploadBackgroundImage = useUploadBackgroundImage();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
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
      <AppSwitcher
        setProject={(project) => {
          router.push(`/`);
        }}
      />
      <ContextMenu>
        <ContextMenuTrigger>
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
                <Link
                  key={name}
                  href={`/${name}`}
                  className={`inline-flex items-center text-sm justify-center rounded-none h-8 px-4 hover:bg-accent/50 ${
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
                </Link>
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
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => createProjectMutation.mutate()}>
            Create Project
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </DndContext>
  );
}
