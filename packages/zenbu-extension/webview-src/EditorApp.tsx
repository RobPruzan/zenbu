import React, { useState, useEffect } from "react";
import { Message } from "./types";

interface EditorAppProps {
  vscode: any;
}

type ToolType =
  | "sidebar-preview"
  | "decorator-preview"
  | "hover-preview"
  | "command-tester"
  | "theme-builder";

interface ToolState {
  toolId: ToolType;
  projectId: string;
  messages: Message[];
  config: any;
}

export const EditorApp: React.FC<EditorAppProps> = ({ vscode }) => {
  const [toolState, setToolState] = useState<ToolState | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"sidebar" | "editor">(
    "sidebar"
  );

  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "loadTool") {
        setToolState({
          toolId: message.toolId,
          projectId: message.projectId,
          messages: message.messages || [],
          config: message.config || {},
        });
      }

      if (message.type === "syncMessages") {
        setToolState((prev) =>
          prev
            ? {
                ...prev,
                messages: message.messages,
              }
            : null
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Load saved state
  useEffect(() => {
    const state = vscode.getState();
    if (state?.editorState) {
      setToolState(state.editorState);
    }
  }, []);

  // Save state
  useEffect(() => {
    if (toolState) {
      vscode.setState({
        ...vscode.getState(),
        editorState: toolState,
      });
    }
  }, [toolState, vscode]);

  // Auto-sync messages to sidebar whenever they change
  useEffect(() => {
    if (toolState?.messages && toolState.messages.length > 0) {
      vscode.postMessage({
        command: "syncToSidebar",
        messages: toolState.messages,
        projectId: toolState.projectId,
      });
    }
  }, [toolState?.messages, toolState?.projectId, vscode]);

  const renderToolPreview = () => {
    if (!toolState) {
      return (
        <div className="no-tool">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            style={{ opacity: 0.4 }}
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2>Building Your Extension</h2>
          <p>Select a tool from the sidebar to preview it here</p>
        </div>
      );
    }

    if (previewMode === "editor") {
      // Full editor preview
      return (
        <div className="editor-preview">
          <div className="editor-preview-content">{renderToolContent()}</div>
        </div>
      );
    }

    // Sidebar preview (existing code)
    return (
      <div className="vscode-mock">
        {/* Activity Bar */}
        <div className="mock-activity-bar">
          <div className="activity-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect
                x="4"
                y="4"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="activity-icon active">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="activity-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Sidebar */}
        <div className="mock-sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">
              {toolState.toolId === "sidebar-preview" && "MY EXTENSION"}
              {toolState.toolId === "decorator-preview" && "DECORATORS"}
              {toolState.toolId === "hover-preview" && "HOVER TOOLS"}
              {toolState.toolId === "command-tester" && "COMMANDS"}
              {toolState.toolId === "theme-builder" && "THEME"}
            </span>
            <div className="sidebar-actions">
              <button className="sidebar-action">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8H13M8 3V13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button className="sidebar-action">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="3"
                    cy="8"
                    r="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="13"
                    cy="8"
                    r="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="sidebar-content">{renderToolContent()}</div>
        </div>
      </div>
    );
  };

  const renderToolContent = () => {
    switch (toolState?.toolId) {
      case "sidebar-preview":
        return (
          <>
            <div className="tree-view">
              <div className="tree-item">
                <span className="tree-arrow">▶</span>
                <span className="tree-icon">📁</span>
                <span>src</span>
              </div>
              <div className="tree-item">
                <span className="tree-arrow">▼</span>
                <span className="tree-icon">📁</span>
                <span>components</span>
              </div>
              <div className="tree-item nested">
                <span className="tree-icon">📄</span>
                <span>Button.tsx</span>
              </div>
              <div className="tree-item nested">
                <span className="tree-icon">📄</span>
                <span>Card.tsx</span>
              </div>
              <div className="tree-item">
                <span className="tree-icon">📋</span>
                <span>package.json</span>
              </div>
            </div>
            <div className="sidebar-section">
              <h4>OUTLINE</h4>
              <div className="outline-item">⚡ functions</div>
              <div className="outline-item nested">example()</div>
            </div>
          </>
        );

      case "decorator-preview":
        return (
          <div className="decorator-list">
            <h4>ACTIVE DECORATORS</h4>
            <label className="decorator-item">
              <input type="checkbox" checked readOnly />
              <span>Color Previews</span>
            </label>
            <label className="decorator-item">
              <input type="checkbox" checked readOnly />
              <span>Size Indicators</span>
            </label>
            <label className="decorator-item">
              <input type="checkbox" readOnly />
              <span>Git Blame</span>
            </label>
            <div className="decorator-preview-section">
              <h4>PREVIEW</h4>
              <div className="decorator-example">
                <span>color:</span>
                <span
                  className="color-box"
                  style={{ backgroundColor: "#3498db" }}
                ></span>
                <span>#3498db</span>
              </div>
            </div>
          </div>
        );

      case "hover-preview":
        return (
          <div className="hover-config">
            <h4>HOVER PROVIDERS</h4>
            <div className="provider-item">
              <span className="provider-icon">💬</span>
              <span>Documentation</span>
            </div>
            <div className="provider-item active">
              <span className="provider-icon">🎨</span>
              <span>Color Preview</span>
            </div>
            <div className="provider-item">
              <span className="provider-icon">📊</span>
              <span>Type Information</span>
            </div>
            <div className="hover-test">
              <h4>TEST AREA</h4>
              <p>Hover over items in the editor to test</p>
            </div>
          </div>
        );

      case "command-tester":
        return (
          <div className="command-config">
            <h4>REGISTERED COMMANDS</h4>
            <div className="command-item">
              <div className="command-info">
                <span className="command-name">Format Document</span>
                <span className="command-id">editor.action.formatDocument</span>
              </div>
              <span className="command-key">⌘⇧F</span>
            </div>
            <div className="command-item">
              <div className="command-info">
                <span className="command-name">Quick Open</span>
                <span className="command-id">workbench.action.quickOpen</span>
              </div>
              <span className="command-key">⌘P</span>
            </div>
            <button className="add-command">+ Add Command</button>
          </div>
        );

      case "theme-builder":
        return (
          <div className="theme-config">
            <h4>THEME COLORS</h4>
            <div className="color-group">
              <label>Editor Background</label>
              <div className="color-input">
                <input type="color" value="#1e1e1e" readOnly />
                <span>#1e1e1e</span>
              </div>
            </div>
            <div className="color-group">
              <label>Editor Foreground</label>
              <div className="color-input">
                <input type="color" value="#d4d4d4" readOnly />
                <span>#d4d4d4</span>
              </div>
            </div>
            <div className="color-group">
              <label>Sidebar Background</label>
              <div className="color-input">
                <input type="color" value="#252526" readOnly />
                <span>#252526</span>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tool to preview</div>;
    }
  };

  return (
    <div className="editor-app">
      <div className="editor-content">
        <div className="preview-stage">
          <div className="preview-top-bar">
            <button
              className="back-button"
              onClick={() => {
                vscode.postMessage({
                  command: "focusSidebar",
                });
              }}
              title="Back to chat"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 4L6 8L10 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>
            <div className="preview-mode-toggle">
              <button
                className={`mode-button ${
                  previewMode === "sidebar" ? "active" : ""
                }`}
                onClick={() => setPreviewMode("sidebar")}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="1"
                    y="2"
                    width="3"
                    height="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="5"
                    y="2"
                    width="10"
                    height="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Sidebar
              </button>
              <button
                className={`mode-button ${
                  previewMode === "editor" ? "active" : ""
                }`}
                onClick={() => setPreviewMode("editor")}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="2"
                    y="2"
                    width="12"
                    height="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Editor
              </button>
            </div>
          </div>
          <div className={`preview-content ${previewMode}`}>
            {renderToolPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};
