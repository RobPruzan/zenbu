import React, { Suspense } from "react";
import { Button } from "~/components/ui/button";
import { vscodeAPI } from "./rpc/webview-rpc";
import { ChatInstanceContext } from "~/components/chat-store";
import { Editor } from "~/app/v2/editor";
import { api } from "~/trpc/react";

// Loading component for suspense
const EditorLoading = () => (
  <div style={{ padding: "20px", textAlign: "center" }}>
    <p>Loading editor...</p>
  </div>
);

// Separate component that uses the Editor from zenbu-app
const EditorContent = ({ projectId }: { projectId: string }) => {
  return (
    <Suspense fallback={<EditorLoading />}>
      <Editor projectId={projectId} />
    </Suspense>
  );
};

export const EditorApp: React.FC = () => {
  // Use regular query instead of suspense query
  const {
    data: projects,
    isLoading,
    error,
  } = api.daemon.getProjects.useQuery();

  const currentProject = projects?.[0]; // For now, just use the first project

  const handleOpenSidebar = async () => {
    await vscodeAPI.openSidebar();
  };

  if (isLoading) {
    return <EditorLoading />;
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Error loading projects</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>No projects available</h1>
        <p>Please start a project first.</p>
      </div>
    );
  }

  return <EditorContent projectId={currentProject.name} />;
};
