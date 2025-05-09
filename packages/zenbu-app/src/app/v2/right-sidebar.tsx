import { useSidebarRouter } from "./context";
import { ChatSidebar } from "./chat-sidebar";
import { AnimatedSidebar } from "./animated-sidebar";

export const RightSidebar = () => {
  const sidebar = useSidebarRouter();
  return (
    <div className="w-fit">
      <AnimatedSidebar
        width={"350px"}
        data={sidebar.right}
        renderSidebarContent={(right) => {
          switch (right) {
            case "chat": {
              return <ChatSidebar />;
            }
          }
        }}
      />
    </div>
  );
};
