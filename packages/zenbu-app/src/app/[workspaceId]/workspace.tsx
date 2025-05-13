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
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

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
  const [[projects, tags]] = trpc.useSuspenseQueries((t) => [
    t.daemon.getProjects(),

    t.workspace.getTags({ workspaceId: workspace.workspaceId }),
  ]);
  const projectsWithUrl = projects
    .map((project) => ({
      ...project,
      url:
        project.status === "running"
          ? `http://localhost:${project.port}`
          : null,
    }))
    .filter((project) =>
      tags.some((tag) => tag.fromProjectId === project.name),
    );

  console.log("uh", tags);

  // .slice(0, 3);

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

  const createProjectMutation = trpc.daemon.createProject.useMutation();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ContextMenu>
        <ContextMenuTrigger
          // todo, why does vh -> % break
          className="h-[calc(100vh-43px)] w-[calc(100%-400px)]"
        >
          <motion.div
            className="w-full h-full"
            initial={{
              opacity: .3,
            }}
            animate={{
              opacity: 1,
            }}
          >
            <SortableContext items={items} strategy={rectSortingStrategy}>
              <div className="flex flex-col flex-wrap h-full w-full gap-6 p-4 content-start items-start">
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
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() =>
              createProjectMutation.mutate({
                workspaceId: workspace.workspaceId,
              })
            }
          >
            Create App
          </ContextMenuItem>
          <ContextMenuItem>Create Package</ContextMenuItem>
          <ContextMenuItem>Create Model Tool</ContextMenuItem>
          <ContextMenuItem>Create Editor Tool</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </DndContext>
  );
};
