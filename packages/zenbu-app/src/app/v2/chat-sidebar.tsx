import { Chat } from "src/components/chat/chat";
import { useSidebarRouter } from "./context";
import { useChatStore } from "src/components/chat-store";
import { cn } from "src/lib/utils";

export const ChatSidebar = ({
  slots,
  className
}: {
  slots?: {
    inputArea?: React.ReactNode;
  };
    className?:string
}) => {
  const sidebar = useSidebarRouter();
  const project = useChatStore((state) => state.iframe.state.project);
  return (
    <div className={cn([
      "w-full h-full",
      className
    ])}>
      <Chat
        slots={slots}
        key={project.name}
        onCloseChat={() => {
          sidebar.setRightSidebarRoute(null);
        }}
      />
    </div>
  );
};
