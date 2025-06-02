import React from "react";
import { Button } from "~/components/ui/button";
import { vscodeAPI } from "./rpc/webview-rpc";

export const SidebarApp: React.FC = () => {
  const handleOpenEditor = async () => {
    await vscodeAPI.openInEditor();
  };

  const handleShowMessage = async () => {
    const result = await vscodeAPI.showInformationMessage(
      "Hello from BiRPC!",
      "OK",
      "Cancel"
    );
    console.log("User selected:", result);
  };

  const handleInputBox = async () => {
    const input = await vscodeAPI.showInputBox({
      prompt: "Enter your name",
      placeHolder: "John Doe",
    });
    if (input) {
      await vscodeAPI.showInformationMessage(`Hello, ${input}!`);
    }
  };

  const handleQuickPick = async () => {
    const selected = await vscodeAPI.showQuickPick(
      ["Option 1", "Option 2", "Option 3"],
      { placeHolder: "Select an option" }
    );
    if (selected) {
      await vscodeAPI.showInformationMessage(`You selected: ${selected}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Zenbu VSCode Extension</h1>
      <p>Now powered by BiRPC!</p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <Button onClick={handleOpenEditor} variant="default" size="lg">
          Open in Editor
        </Button>

        <hr style={{ margin: "10px 0", opacity: 0.2 }} />

        <h3>VSCode API Examples:</h3>

        <Button onClick={handleShowMessage} variant="secondary">
          Show Message
        </Button>

        <Button onClick={handleInputBox} variant="secondary">
          Show Input Box
        </Button>

        <Button onClick={handleQuickPick} variant="secondary">
          Show Quick Pick
        </Button>

        <Button
          onClick={async () => {
            await vscodeAPI.openExternal("https://github.com");
          }}
          variant="link"
        >
          Open GitHub
        </Button>

        <Button
          onClick={async () => {
            const folders = await vscodeAPI.getWorkspaceFolders();
            await vscodeAPI.showInformationMessage(
              `Workspace folders: ${folders.join(", ")}`
            );
          }}
          variant="outline"
        >
          Get Workspace Folders
        </Button>
      </div>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        All VSCode API calls are now type-safe with BiRPC!
      </p>
    </div>
  );
};
