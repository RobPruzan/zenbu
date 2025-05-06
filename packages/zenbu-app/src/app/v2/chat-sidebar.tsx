import { Chat } from "src/components/chat/chat";
import { useSidebarRouter } from "./context";

export const ChatSidebar = () => {
  const sidebar = useSidebarRouter();
  return (
    <div className="w-full h-full">
      <Chat
        onCloseChat={() => {
          sidebar.setRightSidebarRoute(null);
        }}
      />
    </div>
  );
};
