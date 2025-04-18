"use client";

import {
  Folder,
  Loader2,
  Pause,
  Play,
  Plus,
  PlusCircle,
  RadiationIcon,
  Trash2,
} from "lucide-react";
// import { IFrameWrapper } from "./iframe-wrapper";

import { ChatInstanceContext, useChatStore } from "src/components/chat-store";
import { Button } from "src/components/ui/button";
import { trpc } from "src/lib/trpc";
import { IFrameWrapperTwo } from "./iframe-wrapper-2";
import { useState } from "react";
import { cn, iife } from "src/lib/utils";
import { Project } from "zenbu-daemon";

export default function Home() {
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const createProjectMutation = trpc.daemon.createProject.useMutation();
  const startProjectMutation = trpc.daemon.startProject.useMutation();
  const firstRunningProject = projects.find(
    (project) => project.status === "running",
  );

  const [showProjectsSidebar, setShowProjectsSidebar] =
    useState<boolean>(false);
  const firstProject = projects.at(0);

  if (!firstProject) {
    return (
      <div>
        lil bro u have no projects
        <Button
          variant={"outline"}
          onClick={() => {
            createProjectMutation.mutate();
          }}
        >
          Create Project
        </Button>
      </div>
    );
  }

  if (!firstRunningProject) {
    return (
      <div>
        lil bro u have no running projects
        {projects.map((project) => (
          <div
            key={project.name}
            className="flex items-center justify-center gap-x-3"
          >
            <span>{project.name}</span>

            <Button
              onClick={() => {
                startProjectMutation.mutate({ name: project.name });
              }}
              variant={"outline"}
            >
              Start
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <ChatInstanceContext.Provider
        initialValue={{
          iframe: {
            projectId: "idk",
            url: `http://localhost:${firstRunningProject.port}`,
          },
          chatControls: { input: "" },
          context: { items: [] },
          eventLog: { events: [] },
          inspector: { state: { kind: "off" } },
          toolbar: {
            state: {
              activeRoute: "off",
              drawing: { active: false, getEditor: () => null },
              recording: { active: false },
              screenshotting: { active: false },
            },
          },
        }}
      >
        <div className="h-full  bg-background flex border-r">
          <Button
            onClick={() => {
              setShowProjectsSidebar((prev) => !prev);
            }}
            variant={"ghost"}
            className="rounded-none"
          >
            <Folder size={4} />
          </Button>
          {showProjectsSidebar && <ProjectsSidebar />}
        </div>
        <IFrameWrapperTwo>
          <></>
        </IFrameWrapperTwo>
      </ChatInstanceContext.Provider>
    </main>
  );
}
// for killing all processes, clearing redis db, and removing projects
typeof window !== "undefined" &&
  iife(() => {
    // @ts-expect-error
    window.nuke = () => {
      fetch("http://localhost:40000/nuke", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          window.location.reload();
        });
    };
  });

const ProjectsSidebar = () => {
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const createProjectMutation = trpc.daemon.createProject.useMutation();

  const nukeMutation = trpc.daemon.nuke.useMutation();

  return (
    <div className="border-l h-full flex flex-col">
      <div className="flex items-center">
        <Button
          className="w-full  rounded-none border-r"
          onClick={() => {
            createProjectMutation.mutate();
          }}
          variant={"ghost"}
        >
          {createProjectMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <div className="flex gap-x-4 items-center">
              <span>Create Project</span>
              <PlusCircle />
            </div>
          )}
        </Button>
        <Button
          className="rounded-none"
          onClick={() => {
            nukeMutation.mutate();
          }}
          variant={"ghost"}
        >
          {nukeMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RadiationIcon />
          )}
        </Button>
      </div>

      {projects
        .toSorted((a, b) => b.createdAt - a.createdAt)
        .map((project, index) => (
          <div key={project.name} className="flex flex-col">
            <div className="w-full h-px bg-border"></div>
            <ProjectButton key={project.name} project={project} />
            {index === projects.length - 1 && (
              <div className="w-full h-px bg-border"></div>
            )}
          </div>
        ))}
    </div>
  );
};

const ProjectButton = ({ project }: { project: Project }) => {
  const iframe = useChatStore((state) => state.iframe);

  const startProjectMutation = trpc.daemon.startProject.useMutation();
  const killProjectMutation = trpc.daemon.killProject.useMutation();
  const deleteProjectMutation = trpc.daemon.deleteProject.useMutation();
  const deleteProjectButton = deleteProjectMutation.isPending ? (
    <Button variant={"ghost"} className="rounded-none border-l">
      <Loader2 className="animate-spin" />
    </Button>
  ) : (
    <Button
      variant={"ghost"}
      onClick={() => {
        deleteProjectMutation.mutate({ name: project.name });
      }}
      className="rounded-none border-l"
    >
      <Trash2 />
    </Button>
  );

  if (project.status === "killed") {
    return (
      <div className="flex items-center justify-between">
        <Button
          className="justify-start rounded-none"
          key={project.name}
          onClick={async () => {
            const startedProject = await startProjectMutation.mutateAsync({
              name: project.name,
            });

            // stupid, should store the primitives required for url not the url itself
            iframe.actions.setInspectorState({
              url: `http://localhost:${startedProject.port}`,
            });
          }}
          variant={"ghost"}
        >
          <span>{project.name}</span>

          <span className={cn(["text-xs text-muted-foreground"])}>
            {project.status}
          </span>
        </Button>
        {startProjectMutation.isPending ? (
          <Button variant={"ghost"} className="rounded-none border-l">
            <Loader2 className="animate-spin" />
          </Button>
        ) : (
          <Button
            variant={"ghost"}
            onClick={() => {
              startProjectMutation.mutate({ name: project.name });
            }}
            className="rounded-none border-l"
          >
            <Play />
          </Button>
        )}
        {deleteProjectButton}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <Button
        className="justify-start rounded-none"
        key={project.name}
        onClick={async () => {
          iframe.actions.setInspectorState({
            url: `http://localhost:${project.port}`,
          });
        }}
        variant={"ghost"}
      >
        {startProjectMutation.variables?.name === project.name &&
        startProjectMutation.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <span>{project.name}</span>

            <span className={cn(["text-xs text-green-500"])}>
              {project.status}
            </span>
          </>
        )}
      </Button>

      {killProjectMutation.isPending ? (
        <Button className="rounded-none border-l" variant={"ghost"}>
          <Loader2 className="animate-spin" />
        </Button>
      ) : (
        <Button
          className="rounded-none border-l"
          variant={"ghost"}
          onClick={() => {
            killProjectMutation.mutate({
              name: project.name,
            });
          }}
        >
          <Pause />
        </Button>
      )}
      {deleteProjectButton}
    </div>
  );
};
