import React, {
  Suspense,
  useState,
  unstable_ViewTransition as ViewTransition,
} from "react";

/**
 *
 * what do i need to get this going
 *
 * need to get rid of the use params, maybe have that controllable by the global state? Like the iframe that has the project set anyways?
 */
import { flushSync } from "react-dom";
// import { ProjectContext, WorkspaceContext } from "~/app/v2/context";
import { Editor } from "~/app/v2/editor";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

const EditorContainer = ({
  children,
  selectedView,
  setSelectedView,
}: {
  children: React.ReactNode;
  selectedView: "editor" | "sidebar";
  setSelectedView: (view: "editor" | "sidebar") => void;
}) => {
  if (selectedView === "editor") {
    return (
      <div key="fullscreen-editor" className="w-full h-full bg-background">
        {/* <div className="h-[45px] flex justify-end w-full gap-x-2 p-1 absolute right-2 bottom-2">
          <Button
            variant={selectedView === "editor" ? "secondary" : "ghost"}
            className="text-xs"
            onClick={() => setSelectedView("editor")}
          >
            Editor
          </Button>
          <Button
            variant={selectedView === "sidebar" ? "secondary" : "ghost"}
            className="text-xs"
            onClick={() => {
              flushSync(() => {
                setSelectedView("sidebar");
              });
            }}
          >
            Sidebar
          </Button>
        </div> */}
        <div className="h-[calc(100%-0px)]">{children}</div>
      </div>
    );
  }

  return (
    <div
      key="sidebar-editor"
      className="w-full h-full flex items-center justify-center flex-col bg-background pb-4 relative"
    >
      <div className="h-[45px] flex justify-end w-full gap-x-2 p-1 absolute top-2 right-2">
        <Button
          // @ts-expect-error wut
          variant={selectedView === "editor" ? "secondary" : "ghost"}
          className="text-xs"
          onClick={() => {
            flushSync(() => {
              setSelectedView("editor");
            });
          }}
        >
          Editor
        </Button>
        <Button
          variant={selectedView === "sidebar" ? "secondary" : "ghost"}
          className="text-xs"
          onClick={() => setSelectedView("sidebar")}
        >
          Sidebar
        </Button>
      </div>
      <div className="h-[calc(100%-0px)] w-[375px] bg-background border border-border/20 rounded-sm overflow-hidden shadow-sm flex">
        <div className="w-12 bg-background flex flex-col items-center py-2 gap-1 border-r border-border/20">
          <div className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1ZM3 3h10v10H3V3Z" />
            </svg>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="m7.177 3.073 2.083-2.083L8.75.479A1.75 1.75 0 0 0 7.396 0H1.75A1.75 1.75 0 0 0 0 1.75v12.5C0 15.216.784 16 1.75 16h12.5A1.75 1.75 0 0 0 16 14.25V4.604a1.75 1.75 0 0 0-.512-1.236L10.177 8.073a.25.25 0 0 1-.177.073H7.177a.25.25 0 0 1-.177-.427Z" />
            </svg>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm6.5-2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5v-2Z" />
            </svg>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25V2.75A1.75 1.75 0 0 0 14.25 1H1.75ZM1.5 2.75a.25.25 0 0 1 .25-.25h12.5a.25.25 0 0 1 .25.25v10.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25V2.75Z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex-1 bg-background">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const EditorApp = () => {
  const [projects] = api.daemon.getProjects.useSuspenseQuery();
  const [selectedView, setSelectedView] = React.useState<"editor" | "sidebar">(
    "editor"
  );

  const currentProject = projects.at(0);

  const [projectId, setProjectId] = useState(currentProject?.name!);
  const [workspaceId, setWorkspaceId] = useState("home"); // hard coded for now, will have workspaces inside vsc later

  if (!currentProject) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>No projects available in {workspaceId}</h1>
        <p>Please start a project first.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<>loading editor...</>}>
      <Editor
        Container={(props) => (
          <EditorContainer
            {...props}
            selectedView={selectedView}
            setSelectedView={setSelectedView}
          />
        )}
      />
    </Suspense>
  );
};
