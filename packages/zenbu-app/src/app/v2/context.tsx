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

// export const ProjectContext = createContext<{
//   projectId: string;
//   setProjectId: Dispatch<SetStateAction<string>>;
// }>(null!);


// export const useProjectContext = () => useContext(ProjectContext)
// export const WorkspaceContext = createContext<{
//   workspaceId: string;
//   setWorkspaceId: Dispatch<SetStateAction<string>>;
// }>(null!);
// export const useWorkspaceContext = () => useContext(WorkspaceContext)

export type LeftSidebarRoute = "projects" | "experiments" | "chat";
export type RightSidebarRoute = never;
export type BottomSidebarRoute = "terminal";
export const SidebarRouterContext = createContext<{
  left: LeftSidebarRoute | null;
  right: RightSidebarRoute | null;
  bottom: BottomSidebarRoute | null;
  setRightSidebarRoute: (route: RightSidebarRoute | null) => void;
  setLeftSidebarRoute: (route: LeftSidebarRoute | null) => void;
  setBottomSidebarRoute: (route: BottomSidebarRoute | null) => void;
}>(null!);
export const useSidebarRouter = () => useContext(SidebarRouterContext);

export const useSidebarRouterInit = ({
  defaultSidebarOpen,
}: {
  defaultSidebarOpen?: "chat";
}) => {
  const [left, setLeftSidebarRoute] = useState<LeftSidebarRoute | null>(
    defaultSidebarOpen ? "chat" : null,
    // null,
  );
  const [right, setRightSidebarRoute] = useState<RightSidebarRoute | null>(
    // "chat",
    null,
  );
  const [bottom, setBottomSidebarRoute] = useState<BottomSidebarRoute | null>(
    null,
  );
  return {
    bottom,
    setBottomSidebarRoute,
    left,
    right,
    setRightSidebarRoute,
    setLeftSidebarRoute,
  };
};
