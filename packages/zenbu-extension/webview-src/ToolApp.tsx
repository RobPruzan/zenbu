import React, { useState, useEffect } from "react";
import { Message } from "./types";

interface ToolAppProps {
  vscode: any;
}

export const ToolApp: React.FC<ToolAppProps> = ({ vscode }) => {
  const [toolId, setToolId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "loadToolDirect") {
        setToolId(message.toolId);
        setMessages(message.messages || []);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const renderTool = () => {
    if (!toolId) {
      return <div>Loading...</div>;
    }

    // Render the actual tool UI based on the tool ID
    switch (toolId) {
      case "sidebar-preview":
        return (
          <div className="standalone-tool">
            <div className="tool-header">
              <h1>My Extension</h1>
              <button
                onClick={() => vscode.postMessage({ command: "focusSidebar" })}
              >
                Back to Zenbu
              </button>
            </div>
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
                </svg>
                <span>components</span>
              </div>
            </div>
          </div>
        );

      case "decorator-preview":
        return (
          <div className="standalone-tool">
            <h1>Code Decorators</h1>
            <div className="decorator-workspace">
              {/* Full decorator tool UI */}
            </div>
          </div>
        );

      default:
        return <div>Tool not implemented: {toolId}</div>;
    }
  };

  return <div className="tool-app">{renderTool()}</div>;
};
