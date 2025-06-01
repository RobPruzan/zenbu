import React, { useState, useRef, useEffect } from "react";
import { Message, ExtensionProject } from "./types";
import { ZenbuWorkspace } from "./ZenbuWorkspace";

interface EditorChatProps {
  vscode: any;
}

export const EditorChat: React.FC<EditorChatProps> = ({ vscode }) => {
  const [activeView, setActiveView] = useState<"chat" | "workspace">(
    "workspace"
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentProject, setCurrentProject] = useState<ExtensionProject | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen for context from sidebar
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "loadContext") {
        if (message.messages) {
          setMessages(
            message.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
          );
        }
        if (message.project) {
          setCurrentProject(message.project);
        }
        // Switch to chat view if we have messages
        if (message.messages && message.messages.length > 0) {
          setActiveView("chat");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Load messages from state
  useEffect(() => {
    const state = vscode.getState();
    if (state?.editorMessages) {
      const loadedMessages = state.editorMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(loadedMessages);
    }
    if (state?.currentProject) {
      setCurrentProject(state.currentProject);
    }
    if (state?.activeView) {
      setActiveView(state.activeView);
    }
  }, []);

  // Save state
  useEffect(() => {
    const currentState = vscode.getState() || {};
    const messagesToSave = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));
    vscode.setState({
      ...currentState,
      editorMessages: messagesToSave,
      currentProject,
      activeView,
    });
  }, [messages, currentProject, activeView, vscode]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2);

  const sendMessage = () => {
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

    // Mock AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        content: getMockResponse(content),
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const getMockResponse = (input: string): string => {
    const responses = [
      "I'll help you enhance that extension. Let me analyze what we can improve...",
      "Great idea! Here's how we can implement that feature...",
      "I've updated the code to include your requested functionality...",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const syncToSidebar = () => {
    vscode.postMessage({
      command: "syncState",
      state: {
        messages,
        currentProject,
      },
    });
  };

  return (
    <div className="editor-chat">
      <div className="editor-chat-header">
        <div className="header-content">
          <h1>Zenbu Editor</h1>
          <p className="subtitle">
            {currentProject
              ? `Building: ${currentProject.name}`
              : "Advanced extension development"}
          </p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-button ${
                activeView === "chat" ? "active" : ""
              }`}
              onClick={() => setActiveView("chat")}
            >
              Chat
            </button>
            <button
              className={`toggle-button ${
                activeView === "workspace" ? "active" : ""
              }`}
              onClick={() => setActiveView("workspace")}
            >
              Workspace
            </button>
          </div>
          <button
            className="browser-button"
            onClick={() => {
              vscode.postMessage({
                command: "openBrowser",
                url: "http://localhost:3000",
              });
            }}
            title="Open localhost:3000"
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
          </button>
          <button
            className="sync-button"
            onClick={syncToSidebar}
            title="Sync to sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 2L8 6H11C11 8.76 8.76 11 6 11C5.36 11 4.76 10.86 4.22 10.61L2.81 12.02C3.73 12.64 4.83 13 6 13C9.87 13 13 9.87 13 6H16L12 2ZM5 6C5 3.24 7.24 1 10 1C10.64 1 11.24 1.14 11.78 1.39L13.19 0C12.27 -0.64 11.17 -1 10 -1C6.13 -1 3 2.13 3 6H0L4 10L8 6H5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {activeView === "chat" ? (
        <>
          <div className="editor-messages-container">
            {messages.length === 0 ? (
              <div className="editor-welcome">
                <div className="welcome-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2>Advanced Mode</h2>
                <p>
                  Build complex VS Code extensions with full workspace features
                </p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`editor-message ${message.role}`}
                  >
                    <div className="message-avatar">
                      {message.role === "user" ? "You" : "AI"}
                    </div>
                    <div className="message-bubble">
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="editor-input-container">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                className="editor-input"
                placeholder="Describe what you want to build..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="editor-send-button"
                onClick={sendMessage}
                disabled={!inputValue.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M2 10L8 4V8H18V12H8V16L2 10Z"
                    fill="currentColor"
                    transform="rotate(180 10 10)"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="workspace-container">
          <ZenbuWorkspace vscode={vscode} />
        </div>
      )}
    </div>
  );
};
