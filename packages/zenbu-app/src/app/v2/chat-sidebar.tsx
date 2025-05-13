import { Chat } from "src/components/chat/chat";
import { useSidebarRouter } from "./context";
import { useChatStore } from "src/components/chat-store";

export const ChatSidebar = () => {
  const sidebar = useSidebarRouter();
  const project = useChatStore((state) => state.iframe.state.project);
  return (
    <div className="w-full h-full border-l">
      <Chat
        key={project.name}
        onCloseChat={() => {
          sidebar.setRightSidebarRoute(null);
        }}
      />
    </div>
  );
};
