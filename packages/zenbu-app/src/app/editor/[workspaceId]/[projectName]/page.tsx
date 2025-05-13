"use client";
import { trpc } from "src/lib/trpc";
import { unstable_ViewTransition as ViewTransition } from "react";
import { css } from "src/lib/utils";
import { Editor } from "src/app/v2/editor";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function Page() {
  const { projectName, workspaceId } = useParams<{
    projectName: string;
    workspaceId: string;
  }>();
  const [[workspace]] = trpc.useSuspenseQueries((t) => [
    // t.daemon.getProjects(),
    // need to nest workspace name somehow i guess
    t.workspace.getWorkspace({ workspaceId }),
  ]);

  return (

      <motion.div
      
        initial={{
          // height: "90vh",
          // width: "90vw",
          opacity: 0.5,
        }}
        animate={{
          // height: "100vh",
          // width: "100vw",
          opacity: 1,
        }}
        style={
          {
            // backgroundImage: workspace.backgroundImageUrl
            //   ? `url(${workspace.backgroundImageUrl})`
            //   : "",
            // backgroundSize: "cover",
            // backgroundPosition: "center",
            // backgroundRepeat: "no-repeat",
          }
        }
        className="relative flex justify-center items-center"
      >
        <Editor projectId={projectName} />
      </motion.div>
    
  );
}
