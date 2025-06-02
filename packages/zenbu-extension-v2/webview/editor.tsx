import React, { Suspense } from "react";
import { Editor } from "~/app/v2/editor";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export const EditorApp = () => {
  const [projects] = api.daemon.getProjects.useSuspenseQuery();

  const currentProject = projects.at(1);

  if (!currentProject) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>No projects available</h1>
        <p>Please start a project first.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<>loading editor...</>}>
      <Editor
        Container={({ children }) => (
          <div className="w-full h-full flex items-center justify-center flex-col">
            <div className="mb-auto h-[20px] flex justify-end w-full gap-x-2 p-1">
              <Button
               variant={'secondary'} 
                className="text-xs">Editor</Button>
              <Button
               variant={'ghost'} 
                className="text-xs">Sidebar</Button>
            </div>
            <div className="h-[93%] w-[300px] mb-auto">{children}</div>
          </div>
        )}
        projectId={currentProject.name}
      />
    </Suspense>
  );
};
