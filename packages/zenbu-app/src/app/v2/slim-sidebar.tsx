import { FolderIcon, HomeIcon } from "lucide-react";
import { Button } from "src/components/ui/button";
import { useSidebarRouter } from "./context";
import { useRouter } from "next/navigation";

export const SlimSidebar = () => {
  const sidebar = useSidebarRouter();
  const router = useRouter();
  return (
    <div className="w-14 h-full flex flex-col self-start pt-4">
      <Button
        onClick={() => {
          router.push("/home");
        }}
        variant="ghost"
        className={`w-full h-10 flex items-center justify-center ${
          sidebar.left === "projects"
            ? "text-accent-foreground bg-accent/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
        }`}
      >
        <HomeIcon size={18} />
      </Button>
      <Button
        onClick={() => {
          sidebar.setLeftSidebarRoute(
            sidebar.left === "projects" ? null : "projects",
          );
        }}
        variant="ghost"
        className={`w-full h-10 flex items-center justify-center ${
          sidebar.left === "projects"
            ? "text-accent-foreground bg-accent/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
        }`}
      >
        <FolderIcon size={18} />
      </Button>
    </div>
  );
};
