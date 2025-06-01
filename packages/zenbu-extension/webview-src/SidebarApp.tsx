import React, { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "./types";

interface SidebarAppProps {
  vscode: any;
}

type View = "chat" | "tools";

const TOOLS = [
  {
    id: "sidebar-preview",
    name: "Sidebar Preview",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="2"
          y="3"
          width="5"
          height="14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="8"
          y="3"
          width="10"
          height="14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    description: "Preview sidebar extensions",
    shortcut: "⌘⇧S",
  },
  {
    id: "decorator-preview",
    name: "Code Decorators",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8.5 7.5L11.5 12.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    description: "Preview code decorations",
    shortcut: "⌘⇧D",
  },
  {
    id: "hover-preview",
    name: "Hover Providers",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V12C17 12.5523 16.5523 13 16 13H11L7 17V13H4C3.44772 13 3 12.5523 3 12V4Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="7" cy="8" r="1" fill="currentColor" />
        <circle cx="10" cy="8" r="1" fill="currentColor" />
        <circle cx="13" cy="8" r="1" fill="currentColor" />
      </svg>
    ),
    description: "Test hover interactions",
    shortcut: "⌘⇧H",
  },
  {
    id: "command-tester",
    name: "Command Tester",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 10L9 5L7 12L11 10L9 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="12"
          y="8"
          width="5"
          height="3"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    description: "Test commands and shortcuts",
    shortcut: "⌘K",
  },
  {
    id: "theme-builder",
    name: "Theme Builder",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 3V10L14 14" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="8" r="2" fill="currentColor" />
        <circle cx="14" cy="8" r="2" fill="currentColor" />
        <circle cx="10" cy="14" r="2" fill="currentColor" />
      </svg>
    ),
    description: "Build VS Code themes",
    shortcut: "⌘⇧T",
  },
];

export const SidebarApp: React.FC<SidebarAppProps> = ({ vscode }) => {
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load state
  useEffect(() => {
    const state = vscode.getState();
    if (state?.sidebarState) {
      if (state.sidebarState.messages) {
        setMessages(
          state.sidebarState.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }
      if (state.sidebarState.currentProjectId) {
        setCurrentProjectId(state.sidebarState.currentProjectId);
      }
      if (state.sidebarState.view) {
        setView(state.sidebarState.view);
      }
    }
  }, []);

  // Listen for sync messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "syncMessages") {
        // Auto-sync messages from editor
        setMessages(
          message.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
        if (message.projectId) {
          setCurrentProjectId(message.projectId);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Save state
  useEffect(() => {
    const messagesToSave = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));

    vscode.setState({
      ...vscode.getState(),
      sidebarState: {
        messages: messagesToSave,
        currentProjectId,
        view,
      },
    });
  }, [messages, currentProjectId, view, vscode]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2);

  const sendMessage = useCallback(() => {
    const content = inputValue.trim();
    if (!content) return;

    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Check if user wants to open a tool
    const lower = content.toLowerCase();
    if (
      lower.includes("preview") ||
      lower.includes("test") ||
      lower.includes("build")
    ) {
      // Suggest opening in editor
      setTimeout(() => {
        const aiMessage: Message = {
          id: generateId(),
          content:
            "I'll help you with that. Let me open the appropriate tool in the editor for you.",
          role: "assistant",
          timestamp: new Date(),
          actions: [
            {
              type: "open-tool",
              label: "Open Tool",
              toolId: "sidebar-preview",
            },
          ],
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 500);
    } else {
      // Normal response
      setTimeout(() => {
        const aiMessage: Message = {
          id: generateId(),
          content:
            "I can help you build VS Code extensions. What would you like to create?",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 1000);
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openTool = (toolId: string) => {
    setActiveToolId(toolId);
    const projectId = currentProjectId || generateId();
    setCurrentProjectId(projectId);
  };

  const openToolInEditor = (toolId: string) => {
    const projectId = currentProjectId || generateId();
    setCurrentProjectId(projectId);

    vscode.postMessage({
      command: "openToolInNewTab",
      toolId,
      projectId,
      messages, // Pass current chat messages
    });
  };

  const openToolPreview = (toolId: string) => {
    const projectId = currentProjectId || generateId();
    setCurrentProjectId(projectId);

    vscode.postMessage({
      command: "openTool",
      toolId,
      projectId,
      messages, // Pass current chat messages
    });
  };

  const handleAction = (action: any) => {
    if (action.type === "open-tool") {
      openTool(action.toolId);
    }
  };

  const renderToolView = () => {
    const tool = TOOLS.find((t) => t.id === activeToolId);
    if (!tool) return null;

    // Render the actual tool UI based on the tool ID
    switch (activeToolId) {
      case "sidebar-preview":
        return (
          <div className="tool-content">
            <div className="tree-view">
              <div className="tree-item">
                <span className="tree-arrow">▶</span>
                <svg
                  className="tree-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6 2V14M2 6H14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <span>src</span>
              </div>
              <div className="tree-item">
                <span className="tree-arrow">▼</span>
                <svg
                  className="tree-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6 2V14M2 6H14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <span>components</span>
              </div>
              <div className="tree-item nested">
                <svg
                  className="tree-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 2C3 1.44772 3.44772 1 4 1H10L13 4V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 1V4H13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <span>Button.tsx</span>
              </div>
              <div className="tree-item nested">
                <svg
                  className="tree-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 2C3 1.44772 3.44772 1 4 1H10L13 4V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 1V4H13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <span>Card.tsx</span>
              </div>
            </div>
          </div>
        );
      case "decorator-preview":
        return (
          <div className="tool-content">
            <div className="decorator-controls">
              <h4>Active Decorators</h4>
              <label>
                <input type="checkbox" checked readOnly /> Color Previews
              </label>
              <label>
                <input type="checkbox" checked readOnly /> Size Indicators
              </label>
              <label>
                <input type="checkbox" readOnly /> Git Blame
              </label>
            </div>
          </div>
        );
      // Add other tool UIs...
      default:
        return <div className="tool-content">Tool UI for {tool.name}</div>;
    }
  };

  return (
    <div className="sidebar-app">
      <div className="sidebar-header">
        <h1>Zenbu</h1>
        <div className="view-switcher">
          <button
            className={`view-button ${view === "chat" ? "active" : ""}`}
            onClick={() => setView("chat")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V10C14 10.5523 13.5523 11 13 11H8L4 14V11H3C2.44772 11 2 10.5523 2 10V3Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          <button
            className={`view-button ${view === "tools" ? "active" : ""}`}
            onClick={() => setView("tools")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3H7V7H3V3ZM9 3H13V7H9V3ZM3 9H7V13H3V9ZM9 9H13V13H9V9Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {activeToolId ? (
        // Tool View
        <div className="active-tool-view">
          <div className="tool-header">
            <button
              className="tool-back-button"
              onClick={() => setActiveToolId(null)}
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
            </button>
            <h2>{TOOLS.find((t) => t.id === activeToolId)?.name}</h2>
            <button
              className="tool-edit-button"
              onClick={() => openToolPreview(activeToolId)}
              title="Edit in preview"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11 2L14 5L5 14L2 14L2 11L11 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="tool-container">{renderToolView()}</div>
        </div>
      ) : view === "chat" ? (
        <>
          <div className="chat-container">
            <div className="chat-actions-bar">
              <button
                className="open-editor-button"
                onClick={() => openToolPreview("sidebar-preview")}
                title="View preview in editor"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 12L12 4M12 4H7M12 4V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                View Preview
              </button>
              <button
                className="open-browser-button"
                onClick={() => {
                  vscode.postMessage({
                    command: "openBrowser",
                    url: "http://localhost:3000",
                  });
                }}
                title="Open localhost:3000 in browser"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2C4.686 2 2 4.686 2 8C2 11.314 4.686 14 8 14C11.314 14 14 11.314 14 8C14 4.686 11.314 2 8 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 8H14M8 2C9.5 2 10.5 4.686 10.5 8C10.5 11.314 9.5 14 8 14C6.5 14 5.5 11.314 5.5 8C5.5 4.686 6.5 2 8 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Open Browser
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="welcome">
                <h2>Welcome to Zenbu</h2>
                <p>Build VS Code extensions with AI</p>
                <div className="quick-actions">
                  <button
                    onClick={() => setInputValue("Create a sidebar extension")}
                  >
                    Sidebar Extension
                  </button>
                  <button
                    onClick={() => setInputValue("Build a code decorator")}
                  >
                    Code Decorator
                  </button>
                  <button
                    onClick={() => setInputValue("Make a hover provider")}
                  >
                    Hover Provider
                  </button>
                </div>
              </div>
            ) : (
              <div className="messages">
                {messages.map((message) => (
                  <div key={message.id} className={`message ${message.role}`}>
                    <div className="message-content">{message.content}</div>
                    {message.actions && (
                      <div className="message-actions">
                        {message.actions.map((action, i) => (
                          <button
                            key={i}
                            className="action-button"
                            onClick={() => handleAction(action)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="What do you want to build?"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={!inputValue.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="tools-view">
          <div className="tools-header">
            <h2>Developer Tools</h2>
            <p>Open tools in the editor to start building</p>
          </div>

          <div className="tools-grid">
            {TOOLS.map((tool) => (
              <div key={tool.id} className="tool-card">
                <div className="tool-icon">{tool.icon}</div>
                <div className="tool-info">
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
                <div className="tool-actions">
                  <button
                    className="tool-action-button sidebar"
                    onClick={() => openTool(tool.id)}
                    title="Open in sidebar"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect
                        x="2"
                        y="2"
                        width="3"
                        height="12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <rect
                        x="6"
                        y="2"
                        width="8"
                        height="12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                  <button
                    className="tool-action-button editor"
                    onClick={() => openToolInEditor(tool.id)}
                    title="Open in editor"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect
                        x="2"
                        y="2"
                        width="12"
                        height="12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M10 5L13 2M13 2H10M13 2V5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                </div>
                <input
                  className="tool-shortcut"
                  value={tool.shortcut}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    // Mock editable - in real app would update shortcuts
                    console.log(
                      `Updating shortcut for ${tool.id} to ${e.target.value}`
                    );
                  }}
                  placeholder="Set shortcut"
                />
              </div>
            ))}
          </div>

          <div className="tools-footer">
            <p>Tip: You can also ask the AI to open any tool for you</p>
          </div>
        </div>
      )}
    </div>
  );
};
