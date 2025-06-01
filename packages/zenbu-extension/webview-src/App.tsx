import React, { useState, useEffect, useRef, useCallback } from "react";
import { Message, ExtensionProject, TabType, ChatMode } from "./types";

interface AppProps {
  vscode: {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
}

type ComplexityLevel = "simple" | "intermediate" | "advanced";

const App: React.FC<AppProps> = ({ vscode }) => {
  const [complexityLevel, setComplexityLevel] =
    useState<ComplexityLevel>("simple");
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentProject, setCurrentProject] = useState<ExtensionProject | null>(
    null
  );
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load state on mount
  useEffect(() => {
    const state = vscode.getState();
    if (state) {
      if (state.messages) {
        const loadedMessages = state.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(loadedMessages);
        // Auto-detect complexity based on message count
        if (loadedMessages.length > 10) setComplexityLevel("intermediate");
        if (loadedMessages.length > 20) setComplexityLevel("advanced");
      }
      if (state.complexityLevel) setComplexityLevel(state.complexityLevel);
      if (state.currentProject) setCurrentProject(state.currentProject);
      setShowQuickStart(state.messages?.length === 0);
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    const messagesToSave = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));
    vscode.setState({
      messages: messagesToSave,
      complexityLevel,
      currentProject,
    });
  }, [messages, complexityLevel, currentProject]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateId = useCallback(
    () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    []
  );

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
    setShowQuickStart(false);

    // Detect if user needs more advanced features
    if (
      content.toLowerCase().includes("debug") ||
      content.toLowerCase().includes("test") ||
      content.toLowerCase().includes("performance")
    ) {
      setComplexityLevel("intermediate");
    }

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
  }, [inputValue, generateId]);

  const getMockResponse = useCallback((input: string): string => {
    const lower = input.toLowerCase();

    if (lower.includes("sidebar")) {
      return "I'll help you create a sidebar extension. Here's what I'm building:\n\n```typescript\n// Sidebar webview provider\nclass MySidebarProvider implements vscode.WebviewViewProvider {\n  // Implementation here\n}\n```\n\nWould you like to see a preview or add specific features?";
    }

    if (lower.includes("preview") || lower.includes("test")) {
      // Auto-upgrade to intermediate if preview requested
      setComplexityLevel("intermediate");
      return "I've enabled the preview panel for you. You can now see your extension in action while we build it together.";
    }

    return "I can help you build VS Code extensions. What would you like to create?";
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openInEditor = () => {
    vscode.postMessage({
      command: "openInEditor",
      messages,
      project: currentProject,
    });
  };

  const quickStartOptions = [
    {
      icon: "📁",
      title: "File Explorer",
      description: "Custom sidebar for browsing files",
      prompt: "Create a file explorer sidebar with tree view",
    },
    {
      icon: "🎨",
      title: "Color Tools",
      description: "Preview and pick colors in code",
      prompt: "Build a color picker that shows on hover",
    },
    {
      icon: "⚡",
      title: "Quick Commands",
      description: "Add keyboard shortcuts",
      prompt: "Create custom keyboard shortcuts and commands",
    },
    {
      icon: "📊",
      title: "Code Stats",
      description: "Show code metrics and analytics",
      prompt: "Display code statistics in a sidebar panel",
    },
  ];

  return (
    <div className="zenbu-app">
      {/* Header with progressive controls */}
      <div className="app-header">
        <div className="app-title">
          <h1>Zenbu</h1>
          <span className="complexity-badge">{complexityLevel}</span>
        </div>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={openInEditor}
            title="Open in editor"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 12L12 4M12 4H7M12 4V9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>

          {complexityLevel === "advanced" && (
            <button
              className="icon-button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              title="Advanced options"
            >
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
          )}
        </div>
      </div>

      {/* Progressive content area */}
      <div className="app-content">
        {showQuickStart && complexityLevel === "simple" ? (
          <div className="quick-start">
            <h2>What would you like to build?</h2>
            <div className="quick-start-grid">
              {quickStartOptions.map((option, index) => (
                <button
                  key={index}
                  className="quick-start-card"
                  onClick={() => {
                    setInputValue(option.prompt);
                    setShowQuickStart(false);
                  }}
                >
                  <span className="card-icon">{option.icon}</span>
                  <h3>{option.title}</h3>
                  <p>{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Chat messages */}
            <div className="messages-container">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-content">
                    <div className="message-text">{message.content}</div>
                    {message.role === "assistant" &&
                      complexityLevel !== "simple" && (
                        <div className="message-actions">
                          <button className="message-action">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M4 4L12 12M4 12L12 4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            Preview
                          </button>
                          {complexityLevel === "advanced" && (
                            <button className="message-action">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                              >
                                <path
                                  d="M3 8H13M8 3V13"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                              </svg>
                              Debug
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Advanced options panel */}
            {showAdvancedOptions && complexityLevel === "advanced" && (
              <div className="advanced-panel">
                <h3>Advanced Options</h3>
                <div className="option-group">
                  <label>
                    <input type="checkbox" />
                    Enable TypeScript strict mode
                  </label>
                  <label>
                    <input type="checkbox" />
                    Add unit tests
                  </label>
                  <label>
                    <input type="checkbox" />
                    Include documentation
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area - always visible but changes based on complexity */}
      <div className="input-section">
        <div className="input-wrapper">
          {complexityLevel !== "simple" && (
            <div className="input-context">
              {currentProject ? (
                <span>Building: {currentProject.name}</span>
              ) : (
                <span>New extension</span>
              )}
            </div>
          )}
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={
              showQuickStart
                ? "Choose an option above or describe your extension..."
                : "What should we add next?"
            }
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
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

        {complexityLevel === "intermediate" && (
          <div className="input-hints">
            <button
              className="hint-chip"
              onClick={() => setInputValue("Show me a preview")}
            >
              Preview
            </button>
            <button
              className="hint-chip"
              onClick={() => setInputValue("Add error handling")}
            >
              Error handling
            </button>
            <button
              className="hint-chip"
              onClick={() => setComplexityLevel("advanced")}
            >
              More options...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
