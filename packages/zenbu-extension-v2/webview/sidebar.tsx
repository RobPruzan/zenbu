import React from "react";
import { getVSCodeAPI } from "./vscode-api";
import { Button } from "~/components/ui/button";

export const SidebarApp: React.FC = () => {
  const vscode = getVSCodeAPI();

  const handleOpenEditor = () => {
    vscode.postMessage({ type: "openInEditor" });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Hello from Sidebar!</h1>
      <p>If you can see this, React is working!</p>

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

        <h3>Button Variants (VSCode Theme Aware):</h3>

        <Button onClick={handleOpenEditor} variant="default">
          Default Button
        </Button>

        <Button onClick={handleOpenEditor} variant="secondary">
          Secondary Button
        </Button>

        <Button onClick={handleOpenEditor} variant="outline">
          Outline Button
        </Button>

        <Button onClick={handleOpenEditor} variant="destructive">
          Destructive Button
        </Button>

        <Button onClick={handleOpenEditor} variant="ghost">
          Ghost Button
        </Button>

        <Button onClick={handleOpenEditor} variant="link">
          Link Button
        </Button>

        <Button onClick={handleOpenEditor} size="sm">
          Small Button
        </Button>

        <Button onClick={handleOpenEditor} size="lg">
          Large Button
        </Button>
      </div>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        Try switching VSCode themes to see the buttons adapt!
      </p>
    </div>
  );
};
