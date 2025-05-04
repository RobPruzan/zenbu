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
import { ProjectContext } from "./context";

export const Preview =() => {
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
}


