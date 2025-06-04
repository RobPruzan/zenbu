import { Chat } from "src/components/chat/chat";
import { useSidebarRouter } from "./context";
import { useChatStore } from "src/components/chat-store";
import { cn } from "src/lib/utils";
import { useGetProject } from "../[workspaceId]/hooks";

export const ChatSidebar = ({
  slots,
  className,
  chatGradient,
}: {
  slots?: {
    inputArea?: React.ReactNode;
  };
  className?: string;
  chatGradient?: string;
}) => {
  const sidebar = useSidebarRouter();
  // const project = useChatStore((state) => state.iframe.state.project);
  const {project} = useGetProject()
  return (
    // <div className={cn(["w-full h-[calc(100%-0px)]", className])}>
      <Chat
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
