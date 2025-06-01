import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { SidebarApp } from "./SidebarApp";
import { EditorApp } from "./EditorApp";
import { ToolApp } from "./ToolApp";
import "./styles.css";
import "./sidebar.css";
import "./editor.css";

// Initialize build indicator - independent of React app
import "./build-indicator";

declare const acquireVsCodeApi: () => {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

// @ts-ignore
const vscode = acquireVsCodeApi();

let viewContext: "sidebar" | "editor" | "tool" = "sidebar";
let isToolDirect = false;

// Listen for context messages
window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "setContext") {
    viewContext = message.viewContext;
    // Save to state
    vscode.setState({ ...vscode.getState(), viewContext });
    // Re-render with correct context
    renderApp();
  }
  if (message.type === "loadToolDirect") {
    isToolDirect = true;
    renderApp();
  }
});

// Check saved state first
const savedState = vscode.getState();
if (savedState?.viewContext) {
  viewContext = savedState.viewContext;
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

function renderApp() {
  if (isToolDirect) {
    root.render(
      <React.StrictMode>
        <ToolApp vscode={vscode} />
      </React.StrictMode>
    );
  } else if (viewContext === "editor") {
    root.render(
      <React.StrictMode>
        <EditorApp vscode={vscode} />
      </React.StrictMode>
    );
  } else {
    root.render(
      <React.StrictMode>
        <SidebarApp vscode={vscode} />
      </React.StrictMode>
    );
  }
}

// Initial render
renderApp();
