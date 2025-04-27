"use client";

import { cn, iife } from "src/lib/utils";
import { CoreMessage, TextStreamPart } from "ai";
import React, { useState, useEffect, cloneElement } from "react";
import { Loader2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeXml } from "lucide-react";
import { match } from "assert";

// Custom component to render inline code with forced foreground color
const InlineCode = ({ node, inline, className, children, ...props }: any) => {
  // Check if it's inline code (vs. a code block handled by SyntaxHighlighter)
  const match = /language-(\w+)/.exec(className || "");
  if (inline && !match) {
    // Force foreground color by overriding the prose CSS variable
    return (
      <code
        className="text-[10px] px-1 py-0.5 rounded bg-accent/10" // Keep subtle background/padding
        style={
          {
            color: "hsl(var(--foreground))",
            "--tw-prose-code": "hsl(var(--foreground))",
          } as React.CSSProperties
        } // Override prose variable
        {...props}
      >
        {children}
      </code>
    );
  }
  // Fallback for block code
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

// Custom components to force foreground color on specific markdown elements
const ForceForegroundP = ({ node, ...props }: any) => (
  <p className="text-foreground" {...props} />
);
const ForceForegroundLi = ({ node, ...props }: any) => (
  <li className="text-foreground" {...props} />
);
const ForceForegroundStrong = ({ node, ...props }: any) => (
  <strong className="text-foreground" {...props} />
);
const ForceForegroundEm = ({ node, ...props }: any) => (
  <em className="text-foreground" {...props} />
);
// Add more as needed (e.g., headings, blockquotes)
const ForceForegroundH1 = ({ node, ...props }: any) => (
  <h1 className="text-foreground" {...props} />
);
const ForceForegroundH2 = ({ node, ...props }: any) => (
  <h2 className="text-foreground" {...props} />
);
const ForceForegroundH3 = ({ node, ...props }: any) => (
  <h3 className="text-foreground" {...props} />
);

// Helper type - Adjusted to explicitly include potential chunks property
type ContentPart = CoreMessage["content"][number] & {
  chunks?: TextStreamPart<Record<string, any>>[];
};

// Helper function to render individual non-chunk parts (like images/videos if they exist)
function renderNonChunkPart(content: ContentPart, index: number) {
  // Check if it's a string first
  if (typeof content === "string") {
    return <span key={index}>{content}</span>;
  }
  // Added type guard for object check
  if (typeof content !== "object" || content === null) {
    return null;
  }

  switch (content.type) {
    case "image": {
      return (
        <img
          key={index}
          src={(content.image as URL).href}
          alt="Assistant shared image"
          className="rounded-md max-w-[300px] my-2"
        />
      );
    }
    case "file": {
      // Assuming this is video based on previous code
      return (
        <video
          key={index}
          controls
          src={(content.data as URL).toString()}
          className="rounded-md max-w-[300px] my-2"
        />
      );
    }
    // Add cases for other potential non-text, non-tool parts here
    // case "file": ...
    default:
      // We handle text/tool parts via chunks, so ignore 'text' type here
      // unless it *doesn't* have chunks.
      if (content.type === "text" && !content.chunks) {
        return <span key={index}>{content.text}</span>;
      }
      return null;
  }
}

export function AssistantMessage({ message }: { message: CoreMessage }) {
  const [renderedNodes, setRenderedNodes] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const nodes: React.ReactNode[] = [];
    let currentText = "";
    let currentToolCall: {
      toolCallId: string;
      toolName: string;
      args: string;
      isFinished: boolean;
      transitionText: string;
    } | null = null;
    let coderModelTextAccumulator = "";
    let processingCoderModelText = false;

    const finishCurrentText = () => {
      if (currentText) {
        const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;
        const textNodes = [];

        while ((match = codeBlockRegex.exec(currentText)) !== null) {
          if (match.index > lastIndex) {
            const textSegment = currentText.substring(lastIndex, match.index);
            textNodes.push(
              <div
                key={`md-wrap-${nodes.length}-${textNodes.length}`}
                className="prose dark:prose-invert max-w-none prose-p:m-0 prose-ul:m-0 prose-ol:m-0 text-foreground text-xs"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: InlineCode,
                    p: ForceForegroundP,
                    li: ForceForegroundLi,
                    strong: ForceForegroundStrong,
                    em: ForceForegroundEm,
                    h1: ForceForegroundH1,
                    h2: ForceForegroundH2,
                    h3: ForceForegroundH3,
                  }}
                >
                  {textSegment}
                </ReactMarkdown>
              </div>,
            );
          }
          const language = match[1] || "plaintext";
          const code = match[2].trim();
          textNodes.push(
            <div
              key={`code-${nodes.length}-${textNodes.length}`}
              className="my-2 rounded-lg overflow-hidden shadow-sm border border-border/50 bg-accent/5"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/50">
                <div className="text-[10px] text-muted-foreground font-mono">
                  {language}
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-accent/10 rounded-md transition-colors">
                    <CodeXml className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "0.75rem 1rem",
                  background: "transparent",
                  fontSize: "11px",
                }}
                showLineNumbers
                wrapLines
                wrapLongLines
              >
                {code}
              </SyntaxHighlighter>
            </div>,
          );
          lastIndex = codeBlockRegex.lastIndex;
        }

        if (lastIndex < currentText.length) {
          const remainingTextSegment = currentText.substring(lastIndex);
          textNodes.push(
            <div
              key={`md-wrap-${nodes.length}-${textNodes.length}`}
              className="prose dark:prose-invert max-w-none prose-p:m-0 prose-ul:m-0 prose-ol:m-0 text-foreground text-xs"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: InlineCode,
                  p: ForceForegroundP,
                  li: ForceForegroundLi,
                  strong: ForceForegroundStrong,
                  em: ForceForegroundEm,
                  h1: ForceForegroundH1,
                  h2: ForceForegroundH2,
                  h3: ForceForegroundH3,
                }}
              >
                {remainingTextSegment}
              </ReactMarkdown>
            </div>,
          );
        }

        nodes.push(...textNodes);
        currentText = "";
      }
    };

    const finishCoderModelText = () => {
      if (coderModelTextAccumulator) {
        nodes.push(
          <div
            key={`coder-text-${nodes.length}`}
            className="my-2 rounded-lg border border-border/50 bg-accent/5 shadow-sm overflow-hidden"
          >
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50 bg-background/50">
              Coder Model Output
            </div>
            <div
              className="px-4 py-3 text-[11px] whitespace-pre-wrap text-foreground/90 max-h-[200px] overflow-auto"
              ref={(el) => {
                if (el) {
                  el.scrollTop = el.scrollHeight;
                }
              }}
            >
              {coderModelTextAccumulator}
            </div>
          </div>,
        );
        coderModelTextAccumulator = "";
      }
      processingCoderModelText = false;
    };

    const finishCurrentToolCall = () => {
      if (currentToolCall) {
        nodes.push(
          <ToolCallBox key={currentToolCall.toolCallId} {...currentToolCall} />,
        );
        currentToolCall = null;
      }
    };

    // Process content parts
    if (typeof message.content === "string") {
      nodes.push(message.content);
    } else {
      message.content.forEach((part: ContentPart, partIndex) => {
        // Added type guard for object check before accessing type/chunks
        if (typeof part !== "object" || part === null) {
          // Handle potential string parts in content array if necessary
          // nodes.push(<span key={`str-${partIndex}`}>{part}</span>);
          return; // Skip non-object parts for now
        }

        if (part.type === "text" && part.chunks) {
          // Process chunks if they exist on a text part
          part.chunks.forEach((chunk, chunkIndex) => {
            // Generate key using indices as id is not reliable
            const key = `msg-${partIndex}-chunk-${chunkIndex}`;

            switch (chunk.type) {
              case "text-delta":
                if (processingCoderModelText) {
                  coderModelTextAccumulator += chunk.textDelta;
                } else {
                  currentText += chunk.textDelta;
                }
                break;

              case "tool-call-streaming-start":
                finishCurrentText();
                finishCoderModelText();
                // If starting a *new* tool call, finish the previous one
                if (
                  !currentToolCall ||
                  currentToolCall.toolCallId !== chunk.toolCallId
                ) {
                  finishCurrentToolCall();
                  currentToolCall = {
                    toolCallId: chunk.toolCallId,
                    toolName: chunk.toolName,
                    args: "",
                    isFinished: false,
                    transitionText: "",
                  };
                }
                // Potentially handle case where start chunk comes after deltas (though unlikely)
                if (currentToolCall && !currentToolCall.toolName) {
                  currentToolCall.toolName = chunk.toolName;
                }
                break;

              case "tool-call-delta":
                finishCurrentText();
                finishCoderModelText();
                // Start tool call if it hasn't begun (e.g., if start chunk was missed)
                if (!currentToolCall) {
                  currentToolCall = {
                    toolCallId: chunk.toolCallId,
                    toolName: "unknown", // Placeholder if start was missed
                    args: "",
                    isFinished: false,
                    transitionText: "",
                  };
                }
                if (currentToolCall.toolCallId === chunk.toolCallId) {
                  currentToolCall.args += chunk.argsTextDelta;
                }
                break;

              case "tool-call":
                finishCurrentText();
                finishCoderModelText();
                // Ensure a tool call object exists
                if (
                  !currentToolCall ||
                  currentToolCall.toolCallId !== chunk.toolCallId
                ) {
                  finishCurrentToolCall(); // Finish any previous different tool
                  currentToolCall = {
                    toolCallId: chunk.toolCallId,
                    toolName: chunk.toolName,
                    args:
                      typeof chunk.args === "string"
                        ? chunk.args
                        : JSON.stringify(chunk.args, null, 2),
                    isFinished: true,
                    transitionText: currentToolCall?.transitionText || "",
                  };
                } else {
                  // Update existing tool call
                  currentToolCall.toolName = chunk.toolName;
                  currentToolCall.args =
                    typeof chunk.args === "string"
                      ? chunk.args
                      : JSON.stringify(chunk.args, null, 2);
                  currentToolCall.isFinished = true;
                }
                // Render the ToolCallBox *immediately* when the main tool-call part arrives
                if (currentToolCall) {
                  nodes.push(
                    <ToolCallBox
                      key={currentToolCall.toolCallId}
                      {...currentToolCall}
                    />,
                  );
                  currentToolCall = null; // Box is rendered, clear state
                }
                // NOW, start processing coder model text
                processingCoderModelText = true;
                coderModelTextAccumulator = ""; // Reset accumulator
                break;

              // Handle other chunk types if necessary (e.g., finish, error)
              case "finish":
              case "error":
              case "source":
              case "redacted-reasoning":
              case "reasoning":
                // These don't directly contribute to text or tool calls in this logic
                // Could add specific rendering later if needed.
                // For now, finish any pending group.
                finishCurrentText();
                finishCoderModelText();
                finishCurrentToolCall();
                break;

              default:
                // Finish any pending group for unknown types
                finishCurrentText();
                finishCoderModelText();
                finishCurrentToolCall();
                break;
            }
          });
        } else {
          // If it's not a text part with chunks, render it directly
          finishCurrentText();
          finishCurrentToolCall();
          const renderedPart = renderNonChunkPart(part, partIndex);
          if (renderedPart) {
            nodes.push(renderedPart);
          }
        }
      });
    }

    // Finish any remaining groups after iterating through all parts/chunks
    finishCurrentText();
    finishCoderModelText();
    finishCurrentToolCall();

    setRenderedNodes(nodes);
  }, [message.content]); // Removed message.id from dependencies

  return (
    <div className="group mb-6 max-w-full pl-2">
      <div className="text-xs text-foreground font-light leading-relaxed break-words overflow-auto flex flex-col gap-2 whitespace-normal">
        {renderedNodes}
      </div>
    </div>
  );
}

// New component for rendering the tool call box
function ToolCallBox({
  toolName,
  args,
  isFinished,
  toolCallId,
  transitionText,
}: {
  toolName: string;
  args: string;
  isFinished: boolean;
  toolCallId: string;
  transitionText?: string;
}) {
  let properties: Record<string, any> = {};
  try {
    properties = JSON.parse(args);
  } catch (e) {
    properties = { value: args };
  }

  return (
    <div
      key={toolCallId}
      className="my-2 rounded-lg border border-border/50 bg-accent/5 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/50 bg-background/50">
        <span>{toolName}</span>
        {!isFinished && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>
      <div className="px-4 py-3 text-[11px] flex flex-col gap-1.5">
        {Object.entries(properties).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-muted-foreground">{key}:</span>
            <span className="text-foreground/90">
              {JSON.stringify(value).replace(/^"|"$/g, "")}
            </span>
          </div>
        ))}
      </div>
      {transitionText && (
        <div className="px-4 py-2 text-[11px] border-t border-border/50 bg-background/50 text-muted-foreground italic">
          {transitionText}
        </div>
      )}
    </div>
  );
}
