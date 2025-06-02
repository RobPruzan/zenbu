import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "~/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              marginBottom: "16px",
              color: "var(--vscode-errorForeground)",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              marginBottom: "24px",
              color: "var(--vscode-descriptionForeground)",
            }}
          >
            {this.state.error?.message || "An unexpected error occurred"}
          </p>

          {this.state.errorInfo && (
            <details
              style={{
                marginBottom: "24px",
                padding: "16px",
                backgroundColor: "var(--vscode-editor-background)",
                border: "1px solid var(--vscode-panel-border)",
                borderRadius: "4px",
                textAlign: "left",
                maxWidth: "600px",
                width: "100%",
              }}
            >
              <summary style={{ cursor: "pointer", marginBottom: "8px" }}>
                Error details
              </summary>
              <pre
                style={{
                  fontSize: "12px",
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error?.stack}
              </pre>
            </details>
          )}

          <Button onClick={this.handleReset} variant="default">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
