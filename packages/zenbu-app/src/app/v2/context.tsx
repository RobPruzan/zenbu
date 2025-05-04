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

export const ProjectContext = createContext<{
  project: Project;
  setProject: Dispatch<SetStateAction<Project>>;
}>(null!);

export type LeftSidebarRoute = "projects" | "experiments";
export type RightSidebarRoute = "chat";
export const SidebarRouterContext = createContext<{
  left: LeftSidebarRoute | null;
  right: RightSidebarRoute | null;
  setRightSidebarRoute: (route: RightSidebarRoute | null) => void;
  setLeftSidebarRoute: (route: LeftSidebarRoute | null) => void;
}>(null!);
export const useSidebarRouter = () => useContext(SidebarRouterContext);

export const useSidebarRouterInit = () => {
  const [left, setLeftSidebarRoute] = useState<LeftSidebarRoute | null>(
    "projects",
  );
  const [right, setRightSidebarRoute] = useState<RightSidebarRoute | null>(
    null,
  );
  return { left, right, setRightSidebarRoute, setLeftSidebarRoute };
};