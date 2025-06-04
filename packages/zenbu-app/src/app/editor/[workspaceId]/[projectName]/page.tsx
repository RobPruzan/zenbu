"use client";
import { trpc } from "src/lib/trpc";
import { Editor } from "src/app/v2/editor";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProjectContext, WorkspaceContext } from "src/app/v2/context";

/**
 * alright so what would I actually need here
 *
 * I need
 * - an api that hooks into server
 * - an api that hooks back into zenbu
 *  - okay well what would we need from that
 *
 * this seems relatively simple, but why it's a little hard in my mind is that I
 * want to build devtools for the editor in the editor, that requires:
 * - a second instance of zenbu
 * - the model to do multi file edits, probably
 * - a hook to have the tool (some iframe) running inside the editor
 *  - need an iframe running inside the editor
 *
 *
 * okay so if we need the 2 way communication anyways, it may be fun to use that webworker library
 *
 */

export default function Page() {
  const { projectName: projectId, workspaceId } = useParams<{
    projectName: string;
    workspaceId: string;
  }>();
  const [[workspace]] = trpc.useSuspenseQueries((t) => [
    // t.daemon.getProjects(),
    // need to nest workspace name somehow i guess
    t.workspace.getWorkspace({ workspaceId }),
  ]);
  const router = useRouter();

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
      <WorkspaceContext
        value={{
          setWorkspaceId: (workspaceIdOrFn) => {
            if (typeof workspaceIdOrFn === "function") {
              const newWorkspaceId = workspaceIdOrFn(workspaceId);
              router.push(`/editor/${newWorkspaceId}/${projectId}`);
            } else {
              router.push(`/editor/${workspaceIdOrFn}/${projectId}`);
            }
          },
          workspaceId,
        }}
      >
        <ProjectContext
          value={{
            projectId,
            setProjectId: (projectIdOrFn) => {
              if (typeof projectIdOrFn === "function") {
                const newProjectId = projectIdOrFn(projectId);
                router.push(`/editor/${workspaceId}/${newProjectId}`);
              } else {
                router.push(`/editor/${workspaceId}/${projectIdOrFn}`);
              }
            },
          }}
        >
          <Editor defaultSidebarOpen="chat" />
        </ProjectContext>
      </WorkspaceContext>
    </motion.div>
  );
}
