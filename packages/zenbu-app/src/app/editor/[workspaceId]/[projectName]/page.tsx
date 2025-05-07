"use client";
import { trpc } from "src/lib/trpc";
import { unstable_ViewTransition as ViewTransition } from "react";
import { css } from "src/lib/utils";
import { Editor } from "src/app/v2/editor";
import { useParams } from "next/navigation";

export default function Page() {
  const {projectName,workspaceId} = useParams<{projectName:string, workspaceId:string}>()
  const [[workspace]] = trpc.useSuspenseQueries((t) => [
    // t.daemon.getProjects(),
    // need to nest workspace name somehow i guess
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
      className="h-[100vh] w-[100vw] relative flex justify-center items-center"
    >
      <Editor projectId={projectName} />
    </div>
  );
}
