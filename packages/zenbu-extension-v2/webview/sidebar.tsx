import React, { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { vscodeAPI } from "./rpc/webview-rpc";
import { api } from "~/trpc/react";
import { ChatSidebar } from "~/app/v2/chat-sidebar";
import { cn } from "~/lib/utils";
import { LeftSidebar } from "~/app/v2/left-sidebar";
import { trpc } from "./shims/trpc-shim";
import { Header } from "~/components/chat/header";

export const SidebarApp = () => {
  // Example tRPC query - get all workspaces
  // const {
  //   data: workspaces,
  //   isLoading,
  //   error,
  // } = api.workspace.getWorkspaces.useQuery();

  const [projectId] =
    trpc.persistedSingleton.getCurrentProjectId.useSuspenseQuery();
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const project = projects.find((project) => project.name === projectId);
  if (!project) {
    throw new Error("invariant, enforce earlier");
  }
  const runningProjects = useMemo(
    () => projects.filter((project) => project.status === "running"),
    [projects]
  );

  return (
    // <ChatSidebar
    //   slots={{
    //     inputArea: (
    //       <>
    //         {/* <button
    //           className={cn(
    //             "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light",
    //             "bg-accent/10 border hover:bg-accent/20 text-foreground",
    //             "transition-all duration-300"
    //           )}
    //           onClick={async () => {
    //             await vscodeAPI.openExternal(
    //               "http://localhost:3000/editor/home/groovy-viper-370"
    //             );
    //           }}
    //         >
    //           Open In Browser
    //         </button> */}
    //         {/* <button
    //           onClick={async () => {
    //             await vscodeAPI.openInEditor();
    //           }}
    //           className={cn(
    //             "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light",
    //             "bg-accent/10 border hover:bg-accent/20 text-foreground",
    //             "transition-all duration-300"
    //           )}
    //         >
    //         </button> */}

    //         <Button variant={"outline"} size={"sm"}>
    //           Open Preview
    //         </Button>
    //       </>
    //     ),
    //   }}
    // />
    <div className="flex flex-col h-screen w-screen">
      <Header
        onCloseChat={() => {
          // im dumb
        }}
      />
      <div className="flex flex-col h-[calc(100%-48px)]">
        <ChatSidebar
          chatGradient="from-[#070808] to-[#090909]"
          className="border-r border-border/50"
        />
        {/* 
      <LeftSidebar
        allProjects={runningProjects}
        // doesn't matter
        measuredSize={{
          height: 100,
          width: 100,
        }}
      /> */}
      </div>
    </div>
  );
};
