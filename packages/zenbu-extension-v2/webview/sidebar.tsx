import React, { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { vscodeAPI } from "./rpc/webview-rpc";
import { api } from "~/trpc/react";
import { ChatSidebar } from "~/app/v2/chat-sidebar";
import { cn, iife } from "~/lib/utils";
import { LeftSidebar } from "~/app/v2/left-sidebar";
import { trpc } from "./shims/trpc-shim";
import { Header } from "~/components/chat/header";
import { useSidebarRouter } from "~/app/v2/context";

export const SidebarApp = () => {
  // Example tRPC query - get all workspaces
  // const {
  //   data: workspaces,
  //   isLoading,
  //   error,
  // } = api.workspace.getWorkspaces.useQuery();

  // todo, run in parallel
  const [projectId] =
    trpc.persistedSingleton.getCurrentProjectId.useSuspenseQuery();
  const [workspaceId] =
    trpc.persistedSingleton.getCurrentWorkspaceId.useSuspenseQuery();
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const project = projects.find((project) => project.name === projectId);
  if (!project) {
    throw new Error("invariant, enforce earlier");
  }
  const runningProjects = useMemo(
    () => projects.filter((project) => project.status === "running"),
    [projects]
  );

  const router = useSidebarRouter();
  const createProjectMutation = trpc.daemon.createProject.useMutation();

  return (
    <div className="flex flex-col h-screen w-screen">
      <Header
        onCloseChat={() => {
          // im dumb
        }}
      />
      <div className="flex flex-col h-[calc(100%-48px)]">
        {iife(() => {
          switch (router.left) {
            case "chat": {
              return (
                <ChatSidebar
                  chatGradient="from-[#070808] to-[#090909]"
                  className="border-r border-border/50"
                />
              );
            }
            case "projects": {
              return (
                <div className="flex flex-col gap-y-4 items-center p-4">
                  <Button
                    variant={"ghost"}
                    onClick={async () => {
                      createProjectMutation.mutate({
                        workspaceId,
                        pathToSymlinkAt: await vscodeAPI.getWorkspacePath(),
                      });
                    }}
                  >
                    Create Project
                  </Button>
                  {runningProjects.map((project) => (
                    <div className="w-[260px] h-[195px] border rounded-md shadow-xl overflow-hidden">
                      <iframe
                        src={`http://localhost:${project.port}`}
                        className="w-[866px] h-[650px] transform scale-[0.3] origin-top-left"
                      />
                    </div>
                  ))}
                </div>
              );
            }
          }
        })}
      </div>
    </div>
  );
};
