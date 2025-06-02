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

const SIDEBAR_TOOLS = [
  {
    id: "chat",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tooltip: "Chat",
  },
  {
    id: "files",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 5H20C20.5304 5 21.0391 5.21071 21.4142 5.58579C21.7893 5.96086 22 6.46957 22 7V19Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tooltip: "Files",
  },
  {
    id: "search",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
        <path
          d="21 21L16.65 16.65"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tooltip: "Search",
  },
  {
    id: "extensions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tooltip: "Extensions",
  },
  {
    id: "settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tooltip: "Settings",
  },
];

export const EditorApp: React.FC<EditorAppProps> = ({ vscode }) => {
  const [toolState, setToolState] = useState<ToolState | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"sidebar" | "editor">(
    "sidebar"
  );
  const [activeTab, setActiveTab] = useState("chat");

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
    <div className="editor-container">
      {/* Main Editor Content */}
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

      {/* Right Sidebar */}
      <div className="editor-right-sidebar">
        {SIDEBAR_TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`editor-sidebar-btn ${activeTab === tool.id ? "active" : ""}`}
            onClick={() => setActiveTab(tool.id)}
            title={tool.tooltip}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
};
