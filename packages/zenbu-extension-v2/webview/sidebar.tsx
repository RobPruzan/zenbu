import React from "react";
import { Button } from "~/components/ui/button";
import { vscodeAPI } from "./rpc/webview-rpc";
import { api } from "~/trpc/react";
import { ChatSidebar } from "~/app/v2/chat-sidebar";
import { cn } from "~/lib/utils";

export const SidebarApp: React.FC = () => {
  // Example tRPC query - get all workspaces
  const {
    data: workspaces,
    isLoading,
    error,
  } = api.workspace.getWorkspaces.useQuery();

  return (
    <ChatSidebar
      slots={{
        inputArea: (
          <>
            <button
              className={cn(
                "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light",
                "bg-accent/10 border hover:bg-accent/20 text-foreground",
                "transition-all duration-300"
              )}
              onClick={async () => {
                await vscodeAPI.openExternal(
                  "http://localhost:3000/editor/home/groovy-viper-370"
                );
              }}
            >
              Open In Browser
            </button>
            <button
              onClick={async () => {
                await vscodeAPI.openInEditor();
              }}
              className={cn(
                "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-light",
                "bg-accent/10 border hover:bg-accent/20 text-foreground",
                "transition-all duration-300"
              )}
            >
              Open In Editor
            </button>
          </>
        ),
      }}
    />
  );
};
