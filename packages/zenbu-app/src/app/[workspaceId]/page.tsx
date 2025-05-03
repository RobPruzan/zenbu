"use client";

import { ImageIcon } from "lucide-react";
import { Button } from "src/components/ui/button";
import { pluginRPC } from "../rpc";
import { trpc } from "src/lib/trpc";
import { useParams } from "next/navigation";
import { useUploadBackgroundImage } from "./hooks";

export default function Page() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const uploadBackgroundImage = useUploadBackgroundImage();

  const [[projects, workspace]] = trpc.useSuspenseQueries((t) => [
    t.daemon.getProjects(),
    t.workspace.getWorkspace({ workspaceId }),
  ]);

  return (
    <div
      style={{
        backgroundImage: workspace.backgroundImageUrl
          ? `url(${workspace.backgroundImageUrl})`
          : "",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="h-[100vh] w-[100vw] relative"
    >
      <Button
        onClick={async () => {
          uploadBackgroundImage.upload();
        }}
        className="absolute top-2 right-2"
        variant={"ghost"}
      >
        <ImageIcon />
      </Button>


      
    </div>
  );
}
