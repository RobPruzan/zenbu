"use client";

import { Folder } from "lucide-react";
import { IFrameWrapper } from "./iframe-wrapper";

import { ChatInstanceContext } from "src/components/chat-store";
import { Button } from "src/components/ui/button";
import { trpc } from "src/lib/trpc";

export default function Home() {


  const [projects] = trpc.daemon.getProjects.useSuspenseQuery()
  const createProjectMutation = trpc.project.createProject.useMutation()


  if (projects.length === 0) {
    return <div>

      lil bro u have no projects


      <Button variant={'outline'} onClick={() => {
createProjectMutation.mutate({})
      }}>
        Create Project
      </Button>
    </div>
  }
  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <ChatInstanceContext.Provider
        initialValue={{
          iframe: {
            projectId: "idk",
            url: null,
          },
        }}
      >
        <div className="h-full w-4 bg-background flex flex-col">
          <Button variant={"ghost"}>
            <Folder size={4} />
          </Button>
        </div>
        <IFrameWrapper>
          <></>
        </IFrameWrapper>
      </ChatInstanceContext.Provider>
    </main>
  );
}
