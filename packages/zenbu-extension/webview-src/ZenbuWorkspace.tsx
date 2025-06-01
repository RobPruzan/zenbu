import React, { useState, useEffect } from "react";
import {
  Canvas,
  CanvasType,
  ExtensionPattern,
  ExtensionBlueprint,
  WorkspaceLayout,
  ExtensionVersion,
  Change,
} from "./types";
import "./zenbu-workspace.css";

interface ZenbuWorkspaceProps {
  vscode: any;
}

// Pre-defined extension blueprints
const EXTENSION_BLUEPRINTS: ExtensionBlueprint[] = [
  {
    id: "sidebar-panel",
    name: "Sidebar Panel",
    pattern: "sidebar-tool",
    description: "Create a custom sidebar like file explorer or source control",
    requiredCanvases: ["chat", "preview"],
    optionalCanvases: ["visual", "devtools"],
    capabilities: ["webview", "tree-view", "commands"],
    aiPrompt: "I want to create a sidebar panel that...",
  },
  {
    id: "code-decorator",
    name: "Code Decorator",
    pattern: "decorator",
    description: "Add visual decorations to code (git blame, color previews)",
    requiredCanvases: ["visual", "chat"],
    optionalCanvases: ["preview", "devtools"],
    capabilities: ["decorations", "hover", "colors"],
    aiPrompt: "Create decorators that show...",
  },
  {
    id: "vim-shortcuts",
    name: "Command Shortcuts",
    pattern: "command-palette",
    description: "Build keyboard shortcuts and command sequences",
    requiredCanvases: ["command", "chat"],
    optionalCanvases: ["preview"],
    capabilities: ["keybindings", "commands", "macros"],
    aiPrompt: "I want keyboard shortcuts that...",
  },
  {
    id: "hover-info",
    name: "Hover Provider",
    pattern: "hover-provider",
    description: "Show information on hover (docs, previews, tooltips)",
    requiredCanvases: ["chat", "preview"],
    optionalCanvases: ["visual"],
    capabilities: ["hover", "markdown", "widgets"],
    aiPrompt: "Show hover information for...",
  },
];

// Pre-defined workspace layouts
const WORKSPACE_LAYOUTS: Record<string, WorkspaceLayout> = {
  default: {
    id: "default",
    name: "Default",
    canvases: [
      {
        canvas: {
          id: "chat",
          type: "chat",
          title: "AI Chat",
          icon: "💬",
          position: "sidebar",
          state: {},
        },
        gridArea: "sidebar",
        visible: true,
      },
      {
        canvas: {
          id: "preview",
          type: "preview",
          title: "Live Preview",
          icon: "👁",
          position: "main",
          state: {},
        },
        gridArea: "main",
        visible: true,
      },
    ],
  },
  visual: {
    id: "visual",
    name: "Visual Designer",
    canvases: [
      {
        canvas: {
          id: "visual",
          type: "visual",
          title: "Visual Editor",
          icon: "🎨",
          position: "main",
          state: {},
        },
        gridArea: "main",
        visible: true,
      },
      {
        canvas: {
          id: "chat",
          type: "chat",
          title: "AI Assistant",
          icon: "💬",
          position: "sidebar",
          state: {},
        },
        gridArea: "sidebar",
        visible: true,
      },
      {
        canvas: {
          id: "preview",
          type: "preview",
          title: "Preview",
          icon: "👁",
          position: "panel",
          state: {},
        },
        gridArea: "bottom",
        visible: true,
      },
    ],
  },
  devtools: {
    id: "devtools",
    name: "DevTools Mode",
    canvases: [
      {
        canvas: {
          id: "devtools",
          type: "devtools",
          title: "Inspector",
          icon: "🔍",
          position: "main",
          state: {},
        },
        gridArea: "main",
        visible: true,
      },
      {
        canvas: {
          id: "diff",
          type: "diff",
          title: "Changes",
          icon: "📝",
          position: "sidebar",
          state: {},
        },
        gridArea: "sidebar",
        visible: true,
      },
      {
        canvas: {
          id: "chat",
          type: "chat",
          title: "AI",
          icon: "🤖",
          position: "panel",
          state: {},
        },
        gridArea: "bottom",
        visible: true,
      },
    ],
  },
};

export const ZenbuWorkspace: React.FC<ZenbuWorkspaceProps> = ({ vscode }) => {
  const [selectedBlueprint, setSelectedBlueprint] =
    useState<ExtensionBlueprint | null>(null);
  const [activeLayout, setActiveLayout] = useState<WorkspaceLayout>(
    WORKSPACE_LAYOUTS.default
  );
  const [versions, setVersions] = useState<ExtensionVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [activeCanvas, setActiveCanvas] = useState<string>("chat");

  // Mock version history
  const createVersion = (changes: Change[]) => {
    const newVersion: ExtensionVersion = {
      id: Date.now().toString(),
      projectId: selectedBlueprint?.id || "",
      version: `0.${versions.length + 1}.0`,
      timestamp: new Date(),
      changes,
      snapshot: {
        files: {},
        configuration: {},
        dependencies: {},
      },
      aiExplanation: "AI made these changes to implement your request",
    };
    setVersions([...versions, newVersion]);
  };

  const renderCanvas = (canvas: Canvas) => {
    switch (canvas.type) {
      case "chat":
        return (
          <div className="canvas-chat">
            <div className="chat-header">
              <h3>AI Assistant</h3>
              {selectedBlueprint && (
                <div className="blueprint-context">
                  Building: {selectedBlueprint.name}
                </div>
              )}
            </div>
            <div className="chat-messages">
              {/* Chat messages would go here */}
              <div className="ai-suggestion">
                {selectedBlueprint?.aiPrompt ||
                  "How can I help you build your extension?"}
              </div>
            </div>
            <div className="chat-input">
              <textarea placeholder="Describe what you want to build..." />
            </div>
          </div>
        );

      case "visual":
        return (
          <div className="canvas-visual">
            <div className="visual-toolbar">
              <button>🎨 Theme</button>
              <button>📐 Layout</button>
              <button>🎯 Decorators</button>
            </div>
            <div className="visual-editor">
              {/* Visual editor for decorators/themes */}
              <div className="mock-editor">
                <div className="line-decorator">
                  Git: Last modified 2 days ago
                </div>
                <div
                  className="color-decorator"
                  style={{ background: "#ff6b6b" }}
                >
                  #ff6b6b
                </div>
              </div>
            </div>
          </div>
        );

      case "command":
        return (
          <div className="canvas-command">
            <div className="command-builder">
              <h3>Command Builder</h3>
              <div className="shortcut-list">
                <div className="shortcut">
                  <span className="keys">Ctrl+Shift+P</span>
                  <span className="action">Open Command Palette</span>
                </div>
                <button className="add-shortcut">+ Add Shortcut</button>
              </div>
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="canvas-preview">
            <div className="preview-header">
              <span>Live Preview</span>
              <button>🔄 Refresh</button>
            </div>
            <div className="preview-content">
              {selectedBlueprint?.pattern === "sidebar-tool" && (
                <div className="mock-sidebar">
                  <div className="sidebar-title">My Custom Sidebar</div>
                  <div className="tree-item">📁 Project Files</div>
                  <div className="tree-item">📊 Analytics</div>
                </div>
              )}
              {selectedBlueprint?.pattern === "decorator" && (
                <div className="mock-editor-preview">
                  <div className="code-line">
                    <span className="line-number">42</span>
                    <span className="code">const color = </span>
                    <span
                      className="color-preview"
                      style={{ background: "#3498db" }}
                    ></span>
                    <span className="code">"#3498db";</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "devtools":
        return (
          <div className="canvas-devtools">
            <div className="devtools-tabs">
              <button className="active">Elements</button>
              <button>Console</button>
              <button>Network</button>
            </div>
            <div className="devtools-content">
              <div className="element-tree">
                <div className="element">{"<sidebar-view>"}</div>
                <div className="element nested">{"<tree-item>"}</div>
              </div>
            </div>
          </div>
        );

      case "diff":
        return (
          <div className="canvas-diff">
            <div className="diff-header">
              <h3>Changes</h3>
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
              >
                📜 History ({versions.length})
              </button>
            </div>
            {showVersionHistory ? (
              <div className="version-list">
                {versions.map((version) => (
                  <div key={version.id} className="version-item">
                    <div className="version-header">
                      <span className="version-number">v{version.version}</span>
                      <span className="version-time">
                        {version.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="version-changes">
                      {version.changes.map((change, i) => (
                        <div key={i} className="change-item">
                          <span className={`change-type ${change.type}`}>
                            {change.type}
                          </span>
                          <span className="change-path">{change.path}</span>
                        </div>
                      ))}
                    </div>
                    <button className="revert-button">
                      ↩ Revert to this version
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="current-changes">
                <div className="change-summary">
                  <div className="added">+ 3 files added</div>
                  <div className="modified">~ 2 files modified</div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="zenbu-workspace">
      <div className="workspace-header">
        <div className="blueprint-selector">
          <label>Extension Type:</label>
          <select
            value={selectedBlueprint?.id || ""}
            onChange={(e) => {
              const blueprint = EXTENSION_BLUEPRINTS.find(
                (b) => b.id === e.target.value
              );
              setSelectedBlueprint(blueprint || null);
              // Auto-select appropriate layout
              if (
                blueprint?.pattern === "decorator" ||
                blueprint?.pattern === "theme"
              ) {
                setActiveLayout(WORKSPACE_LAYOUTS.visual);
              } else if (blueprint?.pattern === "sidebar-tool") {
                setActiveLayout(WORKSPACE_LAYOUTS.devtools);
              }
            }}
          >
            <option value="">Choose extension type...</option>
            {EXTENSION_BLUEPRINTS.map((blueprint) => (
              <option key={blueprint.id} value={blueprint.id}>
                {blueprint.name} - {blueprint.description}
              </option>
            ))}
          </select>
        </div>

        <div className="layout-selector">
          <label>Layout:</label>
          <div className="layout-buttons">
            {Object.values(WORKSPACE_LAYOUTS).map((layout) => (
              <button
                key={layout.id}
                className={activeLayout.id === layout.id ? "active" : ""}
                onClick={() => setActiveLayout(layout)}
              >
                {layout.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`workspace-grid layout-${activeLayout.id}`}
        style={{
          display: "grid",
          height: "calc(100% - 60px)",
          gap: "1px",
          background: "var(--vscode-widget-border)",
          ...(activeLayout.id === "default" && {
            gridTemplateColumns: "300px 1fr",
            gridTemplateAreas: '"sidebar main"',
          }),
          ...(activeLayout.id === "visual" && {
            gridTemplateColumns: "1fr 300px",
            gridTemplateRows: "1fr 200px",
            gridTemplateAreas: '"main sidebar" "bottom bottom"',
          }),
          ...(activeLayout.id === "devtools" && {
            gridTemplateColumns: "1fr 300px",
            gridTemplateRows: "1fr 200px",
            gridTemplateAreas: '"main sidebar" "bottom bottom"',
          }),
        }}
      >
        {activeLayout.canvases
          .filter(({ visible }) => visible)
          .map(({ canvas, gridArea }) => (
            <div
              key={canvas.id}
              className={`workspace-canvas ${
                activeCanvas === canvas.id ? "active" : ""
              }`}
              style={{
                gridArea,
                background: "var(--vscode-editor-background)",
              }}
              onClick={() => setActiveCanvas(canvas.id)}
            >
              <div className="canvas-header">
                <span className="canvas-icon">{canvas.icon}</span>
                <span className="canvas-title">{canvas.title}</span>
                <button className="canvas-action">⚙️</button>
              </div>
              <div className="canvas-content">{renderCanvas(canvas)}</div>
            </div>
          ))}
      </div>
    </div>
  );
};
