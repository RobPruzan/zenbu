"use client";
import { Editor } from "./v2/editor";
import { trpc } from "src/lib/trpc";
import { unstable_ViewTransition as ViewTransition } from "react";
import { css } from "src/lib/utils";

export default function Page() {
  const [[workspace]] = trpc.useSuspenseQueries((t) => [
    // t.daemon.getProjects(),
    // need to nest workspace name somehow i guess
    t.workspace.getWorkspace({ workspaceId: "home" }),
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
      <Editor />
    </div>
  );
}
