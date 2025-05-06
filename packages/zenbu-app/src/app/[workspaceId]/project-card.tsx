"use client";

import { Edit2Icon } from "lucide-react";
import { Button } from "src/components/ui/button";
// import { pluginRPC } from "../rpc";
import { useRouter } from "next/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "src/components/ui/context-menu";
import { Project } from "zenbu-daemon";
import { useSortable } from "@dnd-kit/sortable";
export const ProjectCard = ({
  project,
  style = {},
}: {
  project: Project & { url: string | null };
  style?: React.CSSProperties;
}) => {
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
          className="flex flex-col w-[200px] gap-2"
        >
          <div
            {...listeners}
            {...attributes}
            className="bg-background rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.2)] overflow-hidden cursor-move"
          >
            {project.url ? (
              <div className="w-[200px] h-[200px] overflow-hidden relative">
                <iframe
                  src={project.url}
                  className="absolute top-0 left-0 w-[400px] h-[400px] pointer-events-none"
                  style={{
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/20" />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] bg-zinc-800 flex items-center justify-center">
                <div className="text-sm text-zinc-400 font-medium">
                  Not Running
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="bg-background backdrop-blur-sm px-3 py-1 rounded-xl">
              <h3 className="font-medium text-sm text-zinc-100">
                {project.name}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-xl bg-background backdrop-blur-sm hover:bg-zinc-800"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                router.push("/");
              }}
            >
              <Edit2Icon className="h-4 w-4" />
            </Button>
          </div>
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
};
