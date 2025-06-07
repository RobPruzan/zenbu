import { Chat } from "src/components/chat/chat";
import { useSidebarRouter } from "./context";
import { useChatStore } from "src/components/chat-store";
import { cn, iife } from "src/lib/utils";
import { useGetProject } from "../[workspaceId]/hooks";
import { useEffect, useState } from "react";

export const ChatSidebar = ({
  slots,
  className,
  chatGradient,
workspaceProjectPath
}: {
  slots?: {
    inputArea?: React.ReactNode;
  };
  className?: string;
  chatGradient?: string;
  workspaceProjectPath:string
}) => {
  const sidebar = useSidebarRouter();
  // const project = useChatStore((state) => state.iframe.state.project);
  const {project} = useGetProject()
  return (
    // <div className={cn(["w-full h-[calc(100%-0px)]", className])}>
      <Chat
      workspaceProjectPath={workspaceProjectPath}
        chatGradient={chatGradient}
        slots={slots}
        key={project.name}
        onCloseChat={() => {
          sidebar.setRightSidebarRoute(null);
        }}
      />
    // </div>
  );
};
