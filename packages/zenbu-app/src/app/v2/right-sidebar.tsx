import { useRouter } from "next/navigation";
import { useSidebarRouter } from "./context";
import { ChatSidebar } from "./chat-sidebar";
import { unstable_ViewTransition as ViewTransition } from "react";
import { iife } from "src/lib/utils";

export const RightSidebar = () => {
  const sidebar = useSidebarRouter();
  if (!sidebar.right) {
    return null;
  }

  return (
    <div className="w-[350px]">
      {iife(() => {
        switch (sidebar.right) {
          case "chat": {
            return <ChatSidebar />;
          }
        }
        sidebar.right satisfies null;
      })}
    </div>
  );
};

// const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <ViewTransition enter="slide-in" exit="slide-out">
//       <div className="w-[350px] h-full">{children}</div>
//     </ViewTransition>
//   );
// };
