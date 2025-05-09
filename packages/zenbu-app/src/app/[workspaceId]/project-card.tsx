"use client";

import { Edit2Icon } from "lucide-react";
import { unstable_ViewTransition as ViewTransition } from "react";
import { Button } from "src/components/ui/button";
// import { pluginRPC } from "../rpc";
import { useParams, useRouter } from "next/navigation";
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
  const { workspaceId } = useParams<{ workspaceId: string }>();
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
  if (!project.url) {
    // todo
    return null
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-fit h-fit">
        <div
          ref={setNodeRef}
          style={cardStyle}
          className="flex flex-col gap-2"
        >
          <div
            {...listeners}
            {...attributes}
            className="bg-background rounded-sm border-[#222222] border-[0.75px] overflow-hidden cursor-move relative group"
            style={{
              boxShadow: "0 4px 8px 1px rgba(53, 53, 53, 0.06)",
              backdropFilter: "blur(5px)",
            }}
          >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none z-20" />
            {project.url ? (
              <div className="w-[350px] h-[215px] overflow-hidden relative">
                <iframe
                  src={project.url}
                  className="absolute top-0 left-0 w-[1400px] h-[860px] pointer-events-none"
                  style={{
                    transform: "scale(0.25)",
                    transformOrigin: "top left",
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/20" />
              </div>
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <div className="text-sm text-zinc-400 font-medium">
                  Not Running
                </div>
              </div>
            )}

          <div className="flex items-center justify-between px-1 absolute z-50 bottom-1 w-full">
            <div
              className="bg-background backdrop-blur-sm px-3 py-1 rounded-sm"
              style={{
                boxShadow:
                  "0 20px 30px -8px rgba(0,0,0,0.7), 0 10px 15px -5px rgba(0,0,0,0.3), inset 0 8px 25px rgba(0,0,0,0.8)",
                background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
              }}
            >
              <h3 className="font-medium text-xs text-zinc-100">
                {project.name}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-sm bg-background backdrop-blur-sm hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-[opacity] duration-200"
              style={{
                boxShadow:
                  "0 20px 30px -8px rgba(0,0,0,0.7), 0 10px 15px -5px rgba(0,0,0,0.3), inset 0 8px 25px rgba(0,0,0,0.8)",
                background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/editor/${workspaceId}/${project.name}`);
              }}
            >
              <Edit2Icon className="h-4 w-4" />
            </Button>
          </div>
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
