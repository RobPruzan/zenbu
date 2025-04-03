import {
  ArrowUpDown,
  Brush,
  ChevronLeft,
  Circle,
  EllipsisIcon,
  Leaf,
  Logs,
  SquareMousePointer,
  X,
  Eraser,
  Square,
  Squircle,
  Undo,
  Redo,
  ListVideo,
  Video,
  Settings,
  SendIcon,
  MessageSquare,
  Activity,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tldraw,
  track,
  useEditor,
  TLEditorComponents,
  createTLStore,
  TldrawEditor,
} from "tldraw";
import "tldraw/tldraw.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import layout from "./layout";
import CustomUiExample from "./custom-ui";

type ToolSection =
  | "select"
  | "console"
  | "network"
  | "more"
  | "draw"
  | "record"
  | "settings"
  | "performance"
  | null;
type ToggleableTools = "record" | "draw";
type RecordingState =
  | "idle"
  | "starting"
  | "recording"
  | "stopping"
  | "recorded"
  | "error";
type Recording = {
  id: string;
  url: string;
  name: string;
  timestamp: number;
};

type InlineChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const getDrawingComponents = (): TLEditorComponents => {
  return {
    Background: () => null,
  };
};

const editorRefGlobal = { current: null as any };

const DrawingPanel = ({ editor }: { editor: any }) => {
  console.log("[DrawingPanel Render] Received editor prop:", editor);

  const tools = [
    {
      id: "select",
      label: "Select",
      icon: <SquareMousePointer size={14} />,
      shortcut: "V",
    },
    { id: "draw", label: "Pen", icon: <Brush size={14} />, shortcut: "D" },
    {
      id: "eraser",
      label: "Eraser",
      icon: <Eraser size={14} />,
      shortcut: "E",
    },
    { id: "geo", label: "Shapes", icon: <Square size={14} />, shortcut: "G" },
  ];

  const geoShapes = [
    { id: "rectangle", label: "Rectangle", icon: <Square size={14} /> },
    { id: "ellipse", label: "Ellipse", icon: <Squircle size={14} /> },
  ];

  const colors = [
    { value: "#ffffff", label: "White" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#22c55e", label: "Green" },
    { value: "#ef4444", label: "Red" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#d946ef", label: "Purple" },
  ];

  const brushSizes = [
    { value: 2, label: "XS" },
    { value: 4, label: "S" },
    { value: 8, label: "M" },
    { value: 12, label: "L" },
    { value: 16, label: "XL" },
  ];

  const opacityLevels = [0.25, 0.5, 0.75, 1];

  const [currentTool, setCurrentTool] = useState("select");
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [currentSize, setCurrentSize] = useState(4);
  const [currentOpacity, setCurrentOpacity] = useState(1);

  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      if (editor && editor.getCurrentToolId) {
        try {
          const toolId = editor.getCurrentToolId();
          const displayToolId =
            toolId === "rectangle" || toolId === "ellipse" ? "geo" : toolId;
          if (displayToolId !== currentTool) {
            setCurrentTool(displayToolId);
          }
        } catch (e) {
          console.error("Failed to get current tool ID:", e);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTool, editor]);

  const setGeoShapeType = (shapeType: string) => {
    if (!editor) {
      console.error("Editor reference not available");
      return;
    }

    try {
      editor.setCurrentTool("geo");
      editor.updateInstanceState({
        stylesForNextShape: {
          ...editor.getInstanceState().stylesForNextShape,
          geo: shapeType,
          // color: currentColor,
          // size: currentSize,
          // opacity: currentOpacity,
        },
      });
      setCurrentTool("geo");
    } catch (e) {
      console.error(`Error setting geo shape type to ${shapeType}:`, e);
    }
  };

  const updateDrawingStyle = useCallback(() => {
    if (!editor) {
      console.error("Editor reference not available");
      return;
    }

    try {
      editor.updateInstanceState({
        stylesForNextShape: {
          ...editor.getInstanceState().stylesForNextShape,
          // color: currentColor,
          // size: currentSize,
          // opacity: currentOpacity,
        },
      });
    } catch (e) {
      console.error("Error updating drawing style:", e);
    }
  }, [currentColor, currentSize, currentOpacity, editor]);

  useEffect(() => {
    updateDrawingStyle();
  }, [currentColor, currentSize, currentOpacity, updateDrawingStyle, editor]);

  return (
    <div className="p-3 text-white/70 text-sm h-full flex flex-col">
      <div className="font-medium mb-2 text-white flex justify-between items-center flex-shrink-0">
        <span>Drawing Tools</span>
        <div className="flex gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-white/70 hover:text-white"
            onClick={() => editor?.undo()}
          >
            <Undo size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-white/70 hover:text-white"
            onClick={() => editor?.redo()}
          >
            <Redo size={12} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {/* Main Tools */}
        <div className="flex flex-wrap gap-1 flex-shrink-0">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant="ghost"
              className={`h-auto p-1.5 flex items-center gap-1.5 text-xs transition-colors 
              ${
                currentTool === tool.id
                  ? "bg-blue-500/30 text-blue-200 hover:bg-blue-500/40 hover:text-blue-100"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => {
                console.log(
                  `[DrawingPanel Click] Button clicked for tool: ${tool.id}. Editor available:`,
                  !!editor,
                );
                if (editor?.setCurrentTool) {
                  try {
                    console.log(
                      `[DrawingPanel Click] Attempting editor.setCurrentTool('${tool.id}')`,
                    );
                    editor.setCurrentTool(tool.id);
                    setCurrentTool(tool.id);
                  } catch (e) {
                    console.error(
                      `[DrawingPanel Click] Failed to set tool to ${tool.id}:`,
                      e,
                    );
                  }
                } else {
                  console.error(
                    "[DrawingPanel Click] Editor or setCurrentTool method not available",
                  );
                }
              }}
            >
              {tool.icon}
              <span>{tool.label}</span>
              <kbd className="ml-1 text-[10px] opacity-50">{tool.shortcut}</kbd>
            </Button>
          ))}
        </div>

        {/* Shape Selection (when geo tool is active) */}
        {currentTool === "geo" && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-white/80">Shape Type</div>
            <div className="flex flex-wrap gap-1">
              {geoShapes.map((shape) => (
                <Button
                  key={shape.id}
                  variant="ghost"
                  className={`h-auto p-1.5 flex items-center gap-1.5 text-xs transition-colors 
                  ${
                    editor?.getInstanceState().stylesForNextShape.geo ===
                    shape.id
                      ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
                  onClick={() => setGeoShapeType(shape.id)}
                >
                  {shape.icon}
                  <span>{shape.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-white/80">Color</div>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded-full transition-transform ${
                  currentColor === color.value
                    ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[rgba(24,24,26,0.6)]"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => setCurrentColor(color.value)}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Brush Size */}
        {/* <div className="space-y-1.5">
          <div className="text-xs font-medium text-white/80">Brush Size</div>
          <div className="flex items-center gap-1">
            {brushSizes.map((size) => (
              <button
                key={size.value}
                className={`flex items-center justify-center h-8 flex-1 rounded transition-colors ${
                  currentSize === size.value
                    ? "bg-blue-500/30 text-blue-200"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                }`}
                onClick={() => setCurrentSize(size.value)}
              >
                <div
                  className="rounded-full bg-current"
                  style={{
                    width: Math.max(4, size.value),
                    height: Math.max(4, size.value),
                  }}
                />
              </button>
            ))}
          </div>
        </div> */}

        {/* Opacity */}
        {/* <div className="space-y-1.5">
          <div className="text-xs font-medium text-white/80">Opacity</div>
          <div className="flex items-center gap-1">
            {opacityLevels.map((opacity) => (
              <button
                key={opacity}
                className={`flex items-center justify-center h-8 flex-1 rounded transition-colors ${
                  currentOpacity === opacity
                    ? "bg-blue-500/30 text-blue-200"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                }`}
                onClick={() => setCurrentOpacity(opacity)}
              >
                <div
                  className="w-4 h-4 rounded-full border border-current"
                  style={{ opacity }}
                />
              </button>
            ))}
          </div>
        </div> */}

        {/* Keyboard Shortcuts */}
        {/* <div className="mt-auto pt-3 border-t border-white/10 space-y-1 text-[10px] text-white/50">
          <div className="font-medium text-xs text-white/70 mb-1.5">
            Keyboard Shortcuts
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between">
              <span>Select Tool</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                V
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Pen Tool</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                D
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Eraser</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                E
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Shapes</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                G
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Rectangle</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                R
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Ellipse</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                O
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Undo</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                ⌘Z
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Redo</span>
              <kbd className="px-1 py-0.5 bg-black/20 rounded text-[9px]">
                ⌘⇧Z
              </kbd>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

const RecordingsPanel = ({
  recordings,
  onSelect,
}: {
  recordings: Recording[];
  onSelect: (rec: Recording) => void;
}) => {
  return (
    <div className="p-3 text-white/70 text-sm h-full flex flex-col">
      <div className="font-medium mb-2 text-white flex-shrink-0">
        <span>Recordings</span>
      </div>
      <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {recordings.length === 0 ? (
          <div className="text-center text-white/50 text-xs py-4">
            No recordings yet.
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {recordings
              .slice()
              .reverse()
              .map((rec) => (
                <li
                  key={rec.id}
                  onClick={() => onSelect(rec)}
                  className="py-1.5 px-2 cursor-pointer border-b border-white/10 hover:bg-white/10 rounded transition-colors flex justify-between items-center text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <Video
                      size={14}
                      className="text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0"
                    />
                    <span className="truncate" title={rec.name}>
                      {rec.name}
                    </span>
                  </div>
                  <span className="text-white/50 flex-shrink-0 ml-2">
                    {new Date(rec.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const InlineChatPanel = () => {
  const [messages, setMessages] = useState<InlineChatMessage[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: input,
        timestamp: Date.now(),
      },
    ]);

    // TODO: Implement actual AI response
    // For now, just add a mock response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "This is a mock response. The actual AI integration will be implemented later.",
          timestamp: Date.now(),
        },
      ]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="font-medium mb-2 text-white flex-shrink-0 p-3 border-b border-white/10">
        <span>AI Assistant</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                msg.role === "assistant"
                  ? "bg-blue-500/20 text-blue-200"
                  : "bg-white/10 text-white"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about this data..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim()}
            className="h-8 w-8 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200"
          >
            <SendIcon size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const TOOLBAR_CONFIG_KEY = "zenbu_toolbar_config";

const DEFAULT_TOOLBAR_ITEMS = [
  { id: "select", label: "Select", icon: <SquareMousePointer size={8} /> },
  { id: "console", label: "Console", icon: <Logs suppressHydrationWarning size={8} /> },
  { id: "network", label: "Network", icon: <ArrowUpDown suppressHydrationWarning size={8} /> },
  { id: "performance", label: "Performance", icon: <Activity suppressHydrationWarning size={8} /> },
  { id: "record", label: "Recordings", icon: <ListVideo suppressHydrationWarning size={8} /> },
  { id: "more", label: "More", icon: <EllipsisIcon suppressHydrationWarning size={8} /> },
  { id: "settings", label: "Settings", icon: <Settings suppressHydrationWarning size={8} /> },
];

export const Toolbar = () => {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<ToolSection>(null);
  const [activeTools, setActiveTools] = useState<Set<ToggleableTools>>(
    new Set(),
  );
  const [drawingCanvasVisible, setDrawingCanvasVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(
    null,
  );
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [visibleToolbarItems, setVisibleToolbarItems] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem(TOOLBAR_CONFIG_KEY);
        return saved
          ? JSON.parse(saved)
          : DEFAULT_TOOLBAR_ITEMS.map((item) => item.id);
      } catch (error) {
        console.warn("Failed to load toolbar config:", error);
        return DEFAULT_TOOLBAR_ITEMS.map((item) => item.id);
      }
    },
  );

  const [chatVisible, setChatVisible] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<
    Array<{
      id: number;
      type: "log" | "info" | "warn" | "error";
      content: string;
      timestamp: string;
    }>
  >([
    {
      id: 1,
      type: "info",
      content: "Application initialized",
      timestamp: "10:42:15",
    },
    {
      id: 2,
      type: "log",
      content: "User session started",
      timestamp: "10:42:16",
    },
    {
      id: 3,
      type: "warn",
      content:
        "Resource interpreted as Script but transferred with MIME type text/plain",
      timestamp: "10:42:18",
    },
    {
      id: 4,
      type: "error",
      content: "Failed to load resource: net::ERR_CONNECTION_REFUSED",
      timestamp: "10:42:20",
    },
    { id: 5, type: "log", content: "Component mounted", timestamp: "10:42:21" },
    {
      id: 6,
      type: "error",
      content: 'TypeError: Cannot read property "value" of undefined',
      timestamp: "10:42:25",
    },
    {
      id: 7,
      type: "log",
      content: "Data fetched successfully",
      timestamp: "10:42:30",
    },
  ]);

  const [editorInstance, setEditorInstance] = useState<any>(null);

  useEffect(() => {
    if (activeSection !== "console") return;

    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    const intercept = (
      type: "log" | "info" | "warn" | "error",
      args: any[],
    ) => {
      const content = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(" ");

      const timestamp = new Date().toLocaleTimeString();

      setConsoleLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          type,
          content,
          timestamp,
        },
      ]);
    };

    console.log = (...args: any[]) => {
      originalConsoleLog(...args);
      intercept("log", args);
    };

    console.info = (...args: any[]) => {
      originalConsoleInfo(...args);
      intercept("info", args);
    };

    console.warn = (...args: any[]) => {
      originalConsoleWarn(...args);
      intercept("warn", args);
    };

    console.error = (...args: any[]) => {
      originalConsoleError(...args);
      intercept("error", args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.info = originalConsoleInfo;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, [activeSection]);

  const clearConsoleLogs = () => {
    setConsoleLogs([]);
  };

  const cleanupActiveRecording = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Cleanup stop error:", e);
        }
      }
      mediaRecorderRef.current = null;
    }
    recordedChunksRef.current = [];
  }, []);

  const stopRecording = useCallback(
    (wasStoppedExternally = false) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === "inactive"
      ) {
        console.warn("Stop recording called but recorder already inactive.");
        if (recordingState !== "idle" && recordingState !== "recorded") {
          cleanupActiveRecording();
          setRecordingState("idle");
          setActiveTools((prev) => {
            const n = new Set(prev);
            n.delete("record");
            return n;
          });
        }
        return;
      }
      if (recordingState === "stopping") return;
      setRecordingState("stopping");
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error calling mediaRecorder.stop():", e);
        cleanupActiveRecording();
        setRecordingState("error");
        setError("Failed to stop recorder.");
        setActiveTools((prev) => {
          const n = new Set(prev);
          n.delete("record");
          return n;
        });
        return;
      }
      if (!wasStoppedExternally) {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    },
    [cleanupActiveRecording, recordingState],
  );

  const startRecording = useCallback(async () => {
    if (mediaStreamRef.current && mediaStreamRef.current.active) {
      console.warn(
        "Start recording blocked: Media stream already exists and is active.",
      );
      return;
    }

    if (
      recordingState !== "idle" &&
      recordingState !== "error" &&
      recordingState !== "recorded"
    ) {
      console.warn(
        `Start recording blocked: Current state is ${recordingState}`,
      );
      return;
    }

    console.log("Attempting to start recording...");
    cleanupActiveRecording();
    setError(null);
    setRecordingState("starting");

    try {
      console.log("Requesting display media...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" } as any,
        audio: true,
      });

      if (!stream) {
        throw new Error("User likely cancelled or failed to get media stream.");
      }
      console.log("Display media stream obtained.");
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen share stopped via browser UI (onended event).");
        stopRecording(true);
      };

      const options = { mimeType: "video/webm; codecs=vp9" };
      let recorder: MediaRecorder;
      try {
        console.log(
          "Attempting to create MediaRecorder with options:",
          options,
        );
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn("VP9 failed, trying default:", e);
        try {
          console.log(
            "Attempting to create MediaRecorder with default options.",
          );
          recorder = new MediaRecorder(stream);
        } catch (fallbackError: any) {
          console.error(
            "Fallback MediaRecorder creation failed:",
            fallbackError,
          );
          throw new Error(
            `MediaRecorder init failed: ${fallbackError?.message}`,
          );
        }
      }
      console.log("MediaRecorder created successfully.");
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Data available: ${event.data.size} bytes`);
          recordedChunksRef.current.push(event.data);
        } else {
          console.log("Data available event with 0 size.");
        }
      };

      recorder.onstop = () => {
        console.log(
          "MediaRecorder onstop event triggered. Final chunks collected:",
          recordedChunksRef.current.length,
        );
        const currentChunks = [...recordedChunksRef.current];
        recordedChunksRef.current = [];

        if (currentChunks.length === 0) {
          console.warn("Recording stopped with no data. Resetting to idle.");
          setRecordingState("idle");
          cleanupActiveRecording();
          setActiveTools((prev) => {
            const n = new Set(prev);
            n.delete("record");
            return n;
          });
          return;
        }

        console.log("Processing recorded data...");
        const blob = new Blob(currentChunks, {
          type: recorder.mimeType || "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const newRecording: Recording = {
          id: `rec_${Date.now()}`,
          url: url,
          name: `Recording ${new Date().toLocaleString()}`,
          timestamp: Date.now(),
        };

        console.log("Adding new recording:", newRecording.name);
        setRecordings((prev) => [...prev, newRecording]);
        setRecordingState("recorded");

        console.log(
          "Setting recording to play immediately:",
          newRecording.name,
        );
        setPlayingRecording(newRecording);

        setActiveSection(null);
        setExpanded(true);

        mediaRecorderRef.current = null;
      };

      recorder.onerror = (event: Event) => {
        const errorMessage =
          (event as any)?.error?.message || "Unknown recording error";
        console.error("MediaRecorder onerror event:", event, errorMessage);
        setError(`Recording error: ${errorMessage}`);
        cleanupActiveRecording();
        setRecordingState("error");
        setActiveTools((prev) => {
          const n = new Set(prev);
          n.delete("record");
          return n;
        });
      };

      console.log("Starting MediaRecorder...");
      recorder.start(1000);
      setRecordingState("recording");
      console.log("Recording state set to 'recording'.");
    } catch (err: any) {
      console.error("Error during startRecording process:", err);
      let message = "An unknown error occurred during recording setup.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError")
          message = "Permission denied. Please allow screen recording access.";
        else message = `Failed to start recording: ${err.message}`;
      }
      setError(message);
      cleanupActiveRecording();
      setRecordingState("error");
      setActiveTools((prev) => {
        const n = new Set(prev);
        n.delete("record");
        return n;
      });
    }
  }, [cleanupActiveRecording, stopRecording, recordingState]);

  const handleClosePlayer = useCallback(() => {
    setPlayingRecording(null);
  }, []);

  const handleSelectRecording = useCallback((recording: Recording) => {
    setPlayingRecording(recording);
    setActiveSection(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanupActiveRecording();
      recordings.forEach((rec) => URL.revokeObjectURL(rec.url));
      if (
        playingRecording &&
        !recordings.some((r) => r.url === playingRecording.url)
      ) {
        URL.revokeObjectURL(playingRecording.url);
      }
    };
  }, [cleanupActiveRecording, recordings, playingRecording]);

  useEffect(() => {
    if (!drawingCanvasVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawingCanvasVisible) return;
      if (e.key === "Escape") {
        setActiveTools((prev) => {
          const newTools = new Set(prev);
          newTools.delete("draw");
          return newTools;
        });
        setDrawingCanvasVisible(false);
        if (!activeTools.has("record")) {
          setActiveSection(null);
        }
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [drawingCanvasVisible, activeTools]);

  useEffect(() => {
    try {
      localStorage.setItem(
        TOOLBAR_CONFIG_KEY,
        JSON.stringify(visibleToolbarItems),
      );
    } catch (error) {
      console.warn("Failed to save toolbar config:", error);
    }
  }, [visibleToolbarItems]);

  const handleToggleToolbarItem = useCallback((id: string) => {
    setVisibleToolbarItems((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const toggleTool = (tool: ToggleableTools) => {
    setActiveTools((prevActiveTools) => {
      const newTools = new Set(prevActiveTools);
      const wasActive = newTools.has(tool);
      let nextSection = activeSection;

      if (wasActive) {
        newTools.delete(tool);
        if (tool === "draw") setDrawingCanvasVisible(false);
        if (tool === "record") {
          if (recordingState === "recording" || recordingState === "starting") {
            stopRecording();
          } else {
            cleanupActiveRecording();
            setRecordingState("idle");
          }
        }
        if (activeSection === tool) {
          const otherTool = tool === "draw" ? "record" : "draw";
          nextSection = newTools.has(otherTool) ? otherTool : null;
        }
      } else {
        newTools.add(tool);
        if (tool === "draw") {
          setDrawingCanvasVisible(true);
          nextSection = "draw";
        }
        if (tool === "record") {
          if (
            recordingState === "idle" ||
            recordingState === "error" ||
            recordingState === "recorded"
          ) {
            startRecording();
            nextSection = "record";
          } else {
            console.warn(
              `Record toggle ON ignored: State is already ${recordingState}`,
            );
          }
        }
        setExpanded(true);
      }

      if (newTools.size === 1) {
        setActiveSection(newTools.has("draw") ? "draw" : "record");
      } else if (newTools.size === 0) {
        setActiveSection(null);
      } else if (newTools.size === 2) {
        setActiveSection(activeSection || "draw");
      }

      return newTools;
    });
  };

  const toggleSection = (section: ToolSection) => {
    if (section !== "draw" && section !== "record") {
      setActiveTools((prev) => {
        const newTools = new Set(prev);
        if (newTools.has("draw")) {
          newTools.delete("draw");
          setDrawingCanvasVisible(false);
        }
        if (newTools.has("record")) {
          newTools.delete("record");
          if (recordingState === "recording" || recordingState === "starting") {
            stopRecording();
          } else {
            cleanupActiveRecording();
            setRecordingState("idle");
          }
        }
        return newTools;
      });
    }

    if (activeSection === section) {
      setActiveSection(null);
      if (section === "settings") {
        setIsSettingsVisible(false);
      }
    } else {
      if (section === "record" && !activeTools.has("record")) {
        setActiveTools((prev) => new Set(prev).add("record"));
      }
      if (section === "draw" && !activeTools.has("draw")) {
        setActiveTools((prev) => new Set(prev).add("draw"));
        setDrawingCanvasVisible(true);
      }
      if (section === "settings") {
        setIsSettingsVisible(true);
      }
      setActiveSection(section);
      setExpanded(true);
    }
  };

  const closeActiveSection = () => {
    setActiveSection(null);
    setIsSettingsVisible(false);
    setActiveTools((prev) => {
      const newTools = new Set(prev);
      if (newTools.has("draw")) {
        newTools.delete("draw");
        setDrawingCanvasVisible(false);
      }
      if (newTools.has("record")) {
        newTools.delete("record");
        if (recordingState === "recording" || recordingState === "starting") {
          stopRecording();
        } else {
          cleanupActiveRecording();
          setRecordingState("idle");
        }
      }
      return newTools;
    });
    setExpanded(false);
  };

  const showDrawPanel = activeSection === "draw" || activeTools.has("draw");
  const showRecordPanel =
    activeSection === "record" || activeTools.has("record");
  const showCombinedPanel = showDrawPanel && showRecordPanel;
  const showAnyToolPanel = showDrawPanel || showRecordPanel;
  const isPanelVisible =
    !playingRecording && expanded && (activeSection || showAnyToolPanel);

  let targetWidth: number | string = 56;
  if (expanded) {
    if (showCombinedPanel) {
      targetWidth = 700;
    } else if (activeSection && !showAnyToolPanel) {
      targetWidth = 700;
    } else if (showAnyToolPanel) {
      targetWidth = 700;
    } else {
      targetWidth = "auto";
    }
  }

  let targetHeight = 0;
  if (isPanelVisible) {
    targetHeight = showCombinedPanel ? 300 : 300;
  }

  const backdropStyle =
    "backdrop-blur-xl bg-[rgba(24,24,26,0.6)] border border-[rgba(255,255,255,0.05)]";
  const shadowStyle =
    "shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.18)]";

  const containerVariants = {
    collapsed: { width: 112 },
    expanded: { width: targetWidth },
  };
  const contentVariants = {
    collapsed: { width: 0, opacity: 0 },
    expanded: { width: "auto", opacity: 1 },
  };
  const panelVariants = {
    collapsed: { height: 0, opacity: 0, pointerEvents: "none" as const },
    expanded: {
      height: targetHeight,
      opacity: 1,
      pointerEvents: "auto" as const,
      transition: { opacity: { duration: 0.15, delay: 0.05 } },
    },
  };

  const isRecordingActive = recordingState === "recording";
  const isRecordingOrStarting =
    recordingState === "recording" || recordingState === "starting";

  useEffect(() => {
    const handleChatVisibilityChange = (event: CustomEvent<boolean>) => {
      setChatVisible(event.detail);
    };

    window.addEventListener(
      "chat-visibility-change",
      handleChatVisibilityChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "chat-visibility-change",
        handleChatVisibilityChange as EventListener,
      );
    };
  }, []);

  const generateMockConsoleLogs = (count: number) => {
    console.log(`Generating ${count} mock console logs...`);

    const types: Array<"log" | "info" | "warn" | "error"> = [
      "log",
      "info",
      "warn",
      "error",
    ];
    const components = [
      "App",
      "Router",
      "Component",
      "Button",
      "Modal",
      "Form",
      "Auth",
      "API",
      "Store",
      "Renderer",
    ];
    const actions = [
      "initialized",
      "updated",
      "rendered",
      "mounted",
      "unmounted",
      "failed",
      "loaded",
      "changed",
      "processed",
      "connected",
    ];
    const errors = [
      "TypeError: Cannot read property of undefined",
      "SyntaxError: Unexpected token",
      "ReferenceError: Variable is not defined",
      "RangeError: Invalid array length",
      "URIError: URI malformed",
      "Error: Network request failed",
      "Error: Timeout exceeded",
      "Error: Maximum call stack size exceeded",
    ];
    const warnings = [
      "Resource interpreted as Script but transferred with MIME type text/plain",
      "Synchronous XMLHttpRequest is deprecated",
      "Password field is not contained in a form",
      "Source map error: request failed with status 404",
      "Using // comments in CSS is non-standard",
      "Event handler registration is deprecated",
      "Viewport meta tag needed for mobile optimization",
    ];
    const objects = [
      { id: 1, status: "active", count: 42 },
      { type: "user", permissions: ["read", "write"] },
      { error: { code: 500, message: "Server error" } },
      { duration: "120ms", size: "45kb", compressed: true },
      { version: "2.3.4", deprecated: false, features: ["a", "b", "c"] },
    ];

    const newLogs = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const timestamp = new Date(
        now - Math.random() * 3600000,
      ).toLocaleTimeString();

      let content = "";

      if (type === "error") {
        content = errors[Math.floor(Math.random() * errors.length)];
        if (Math.random() > 0.7) {
          content +=
            "\n    at " +
            components[Math.floor(Math.random() * components.length)] +
            ".js:" +
            Math.floor(Math.random() * 1000) +
            ":" +
            Math.floor(Math.random() * 100);
        }
      } else if (type === "warn") {
        content = warnings[Math.floor(Math.random() * warnings.length)];
      } else {
        const component =
          components[Math.floor(Math.random() * components.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        content = `${component} ${action}`;

        if (Math.random() > 0.8) {
          const obj = objects[Math.floor(Math.random() * objects.length)];
          content += " " + JSON.stringify(obj);
        }
      }

      if (Math.random() > 0.7) {
        const id = Math.floor(Math.random() * 10000000);
        content += ` (id: ${id})`;
      }

      newLogs.push({
        id: Date.now() + i,
        type,
        content,
        timestamp,
      });
    }

    return newLogs;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawingCanvasVisible) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentEditor = editorInstance;
      console.log(
        "[Toolbar KeyDown] Editor instance available:",
        !!currentEditor,
      );
      if (!currentEditor) return;

      const shortcuts: Record<string, () => void> = {
        v: () => {
          if (currentEditor.setCurrentTool) {
            console.log("[Toolbar KeyDown] Setting tool: select");
            currentEditor.setCurrentTool("select");
          }
        },
        d: () => {
          if (currentEditor.setCurrentTool) {
            console.log("[Toolbar KeyDown] Setting tool: draw");
            currentEditor.setCurrentTool("draw");
          }
        },
        e: () => {
          if (currentEditor.setCurrentTool) {
            console.log("[Toolbar KeyDown] Setting tool: eraser");
            currentEditor.setCurrentTool("eraser");
          }
        },
        g: () => {
          if (currentEditor.setCurrentTool) {
            console.log("[Toolbar KeyDown] Setting tool: geo");
            currentEditor.setCurrentTool("geo");
          }
        },
        r: () => {
          if (currentEditor.setCurrentTool) {
            console.log("[Toolbar KeyDown] Setting tool: rectangle");
            currentEditor.setCurrentTool("geo");
            try {
              currentEditor.updateInstanceState({
                stylesForNextShape: {
                  ...currentEditor.getInstanceState().stylesForNextShape,
                  geo: "rectangle",
                },
              });
            } catch (err) {
              console.error("Failed to set rectangle shape:", err);
            }
          }
        },
        o: () => {
          if (currentEditor.setCurrentTool) {
            console.log("[Toolbar KeyDown] Setting tool: ellipse");
            currentEditor.setCurrentTool("geo");
            try {
              currentEditor.updateInstanceState({
                stylesForNextShape: {
                  ...currentEditor.getInstanceState().stylesForNextShape,
                  geo: "ellipse",
                },
              });
            } catch (err) {
              console.error("Failed to set ellipse shape:", err);
            }
          }
        },
      };

      const key = e.key.toLowerCase();
      if (shortcuts[key]) {
        e.preventDefault();
        console.log(`[Toolbar KeyDown] Executing shortcut for key: ${key}`);
        shortcuts[key]();
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === "z") {
          if (e.shiftKey) {
            e.preventDefault();
            currentEditor.redo();
          } else {
            e.preventDefault();
            currentEditor.undo();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawingCanvasVisible, editorInstance]);

  // console.log("[Toolbar Render] drawingCanvasVisible:", drawingCanvasVisible);

  useEffect(() => {
    if (drawingCanvasVisible) {
      document.body.classList.add("is-drawing-active");
    } else {
      document.body.classList.remove("is-drawing-active");
    }
    // Cleanup function to remove class if toolbar unmounts while drawing
    return () => {
      document.body.classList.remove("is-drawing-active");
    };
  }, [drawingCanvasVisible]);

  return (
    <>
      {drawingCanvasVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "auto",
            zIndex: 60,
            background: "transparent",
          }}
          className="tldraw-wrapper"
        >
          <style jsx global>{`
            .tldraw-wrapper .tl-canvas {
              background: transparent !important;
            }
            .tldraw-wrapper .tl-container {
              background: transparent !important;
            }
          `}</style>
          <Tldraw
          
            hideUi
            components={getDrawingComponents()}
            onMount={(editor) => {
              console.log(
                "[Toolbar Tldraw] onMount - Editor instance created:",
                editor,
              );
              setEditorInstance(editor);
              editor.user.updateUserPreferences({ colorScheme: "dark" });
            }}
          />
        </div>
      )}

      <motion.div
        layout
        variants={containerVariants}
        initial="collapsed"
        animate={expanded ? "expanded" : "collapsed"}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{
          zIndex: 2000000
        }}
        className={`flex items-stretch absolute left-2 bottom-4 ${backdropStyle} rounded-xl overflow-hidden ${shadowStyle}`}
      >
        <div className="flex-shrink-0 flex items-center h-10">
          <Button
            onClick={() => {
              const event = new CustomEvent("toggle-chat", {
                detail: { isVisible: !chatVisible },
              });
              window.dispatchEvent(event);
            }}
            variant="ghost"
            className={`flex items-center justify-center rounded-none w-14 h-10 p-0 transition-colors border-r border-[rgba(255,255,255,0.04)]
              ${
                chatVisible
                  ? "text-blue-400 bg-[rgba(50,50,56,0.7)]"
                  : "text-[#A1A1A6] hover:text-white"
              }`}
          >
            <MessageSquare size={18} />
          </Button>

          <Button
            onClick={() => {
              if (!expanded) {
                setExpanded(true);
              } else if (expanded && (activeSection || showAnyToolPanel)) {
                setActiveSection(null);
                setIsSettingsVisible(false);
                setActiveTools((prev) => {
                  const newTools = new Set(prev);
                  if (newTools.has("draw")) {
                    newTools.delete("draw");
                    setDrawingCanvasVisible(false);
                  }
                  if (newTools.has("record")) {
                    newTools.delete("record");
                    if (
                      recordingState === "recording" ||
                      recordingState === "starting"
                    ) {
                      stopRecording();
                    } else {
                      cleanupActiveRecording();
                      setRecordingState("idle");
                    }
                  }
                  return newTools;
                });
              } else {
                closeActiveSection();
              }
            }}
            variant="ghost"
            className={`flex items-center justify-center rounded-none w-14 h-10 p-0 transition-colors border-r border-[rgba(255,255,255,0.04)]
              ${
                expanded
                  ? "text-[#A1A1A6] hover:text-white"
                  : "text-[#A1A1A6] hover:text-white"
              }`}
          >
            {expanded ? <ChevronLeft size={18} /> : <Leaf size={24} />}
          </Button>
        </div>

        <motion.div
          layout="position"
          variants={contentVariants}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35,
            delay: expanded ? 0.1 : 0,
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex h-10 items-center bg-[rgba(30,30,34,0.55)] flex-shrink-0">
            <div className="flex items-center border-l border-r border-[rgba(255,255,255,0.04)] h-full">
              <Button
                onClick={() => toggleTool("record")}
                variant="ghost"
                className={`flex items-center justify-center rounded-none w-9 h-full transition-colors relative 
                  ${activeTools.has("record") ? "text-red-400" : "text-[#A1A1A6] hover:text-white"} 
                  ${isRecordingOrStarting ? "animate-pulse-strong" : ""}
                `}
                title="Record Screen"
              >
                <div className="flex items-center justify-center w-6 h-6">
                  <Circle
                    size={14}
                    className={
                      isRecordingActive
                        ? "fill-red-500 text-red-500"
                        : activeTools.has("record")
                          ? "text-red-400"
                          : ""
                    }
                  />
                </div>
              </Button>
              <Button
                onClick={() => toggleTool("draw")}
                variant="ghost"
                className={`flex items-center justify-center rounded-none w-9 h-full transition-colors relative ${activeTools.has("draw") ? "text-blue-400" : "text-[#A1A1A6] hover:text-white"}`}
                title="Draw on Screen"
              >
                <div className="flex items-center justify-center w-6 h-6">
                  <Brush size={14} />
                </div>
              </Button>
            </div>
            <div className="flex h-full">
              {DEFAULT_TOOLBAR_ITEMS.filter((item) =>
                visibleToolbarItems.includes(item.id),
              ).map((item) => (
                <Button
                  key={item.id}
                  onClick={() => toggleSection(item.id as ToolSection)}
                  variant="ghost"
                  className={`flex items-center rounded-none text-xs px-2 h-full transition-colors relative whitespace-nowrap ${
                    activeSection === item.id
                      ? "text-white bg-[rgba(50,50,56,0.7)]"
                      : "text-[#A1A1A6] hover:text-white"
                  }`}
                >
                  <span className="mr-1 flex-shrink-0">{item.icon}</span>
                  <span>
                    {item.id === "record"
                      ? `${item.label} (${recordings.length})`
                      : item.label}
                  </span>
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-white"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </Button>
              ))}
            </div>
          </div>

          <motion.div
            layout
            variants={panelVariants}
            initial="collapsed"
            animate={isPanelVisible ? "expanded" : "collapsed"}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden border-t border-[rgba(255,255,255,0.04)] relative"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isPanelVisible && (
                <motion.div
                  key={
                    showCombinedPanel
                      ? "combined"
                      : activeSection ||
                        (showDrawPanel ? "draw" : "record") ||
                        "none"
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="h-full"
                >
                  {showCombinedPanel ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      <ResizablePanel defaultSize={50} minSize={30}>
                        <DrawingPanel editor={editorInstance} />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={50} minSize={30}>
                        {" "}
                        <RecordingsPanel
                          recordings={recordings}
                          onSelect={handleSelectRecording}
                        />{" "}
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : showDrawPanel ? (
                    <DrawingPanel editor={editorInstance} />
                    // <CustomUiExample/>
                  ) : showRecordPanel ? (
                    <RecordingsPanel
                      recordings={recordings}
                      onSelect={handleSelectRecording}
                    />
                  ) : activeSection === "select" ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      <ResizablePanel
                        defaultSize={chatVisible ? 60 : 100}
                        minSize={40}
                        className="h-full"
                      >
                        <div className="p-3 text-white/70 text-sm h-full flex flex-col">
                          <div className="font-medium mb-2 text-white flex justify-between items-center">
                            <span>Selection Options</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  /* TODO: Implement add to chat */
                                }}
                                className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
                              >
                                <MessageSquare size={10} />
                                Add to Chat
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setChatVisible((prev: boolean) => !prev)
                                }
                                className={`h-6 px-2 text-[10px] ${chatVisible ? "bg-blue-500/20 text-blue-200" : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"} flex items-center gap-1`}
                              >
                                <MessageSquare size={10} />
                                {chatVisible ? "Hide AI" : "Show AI"}
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 text-xs opacity-70">...</div>
                        </div>
                      </ResizablePanel>
                      {chatVisible && (
                        <>
                          <ResizableHandle withHandle />
                          <ResizablePanel defaultSize={40} minSize={30}>
                            <InlineChatPanel />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>
                  ) : activeSection === "console" ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      <ResizablePanel
                        defaultSize={chatVisible ? 60 : 100}
                        minSize={40}
                        className="h-full"
                      >
                        <div className="p-3 text-white/70 text-sm h-full flex flex-col">
                          <div className="font-medium mb-2 text-white flex justify-between items-center">
                            <span>Console Output</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const mockLogs =
                                    generateMockConsoleLogs(1000);
                                  setConsoleLogs(mockLogs);
                                }}
                                className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
                              >
                                Generate 100K
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearConsoleLogs}
                                className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
                              >
                                <X size={10} />
                                Clear
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  /* TODO: Implement add to chat */
                                }}
                                className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
                              >
                                <MessageSquare size={10} />
                                Add to Chat
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setChatVisible((prev) => !prev)}
                                className={`h-6 px-2 text-[10px] ${chatVisible ? "bg-blue-500/20 text-blue-200" : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"} flex items-center gap-1`}
                              >
                                <MessageSquare size={10} />
                                {chatVisible ? "Hide AI" : "Show AI"}
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 text-xs font-mono bg-black/20 p-2 rounded mt-2 overflow-y-auto">
                            {consoleLogs.map((log) => (
                              <div
                                key={log.id}
                                className={`py-1 border-b border-white/5 ${
                                  log.type === "error"
                                    ? "text-red-400"
                                    : log.type === "warn"
                                      ? "text-yellow-400"
                                      : log.type === "info"
                                        ? "text-blue-400"
                                        : "text-white/80"
                                }`}
                              >
                                <span className="text-white/40">
                                  [{log.timestamp}]
                                </span>
                                <span className="ml-2">{log.content}</span>
                              </div>
                            ))}
                            {consoleLogs.length === 0 && (
                              <div className="text-white/40 flex items-center justify-center h-full">
                                No console logs to display.
                              </div>
                            )}
                          </div>
                        </div>
                      </ResizablePanel>
                      {chatVisible && (
                        <>
                          <ResizableHandle withHandle />
                          <ResizablePanel defaultSize={40} minSize={30}>
                            <InlineChatPanel />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>
                  ) : activeSection === "network" ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      <ResizablePanel
                        defaultSize={chatVisible ? 60 : 100}
                        minSize={40}
                        className="h-full"
                      >
                        <div className="p-3 text-white/70 text-sm h-full flex flex-col">
                          <div className="font-medium mb-2 text-white flex justify-between items-center">
                            <span>Network Activity</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  /* TODO: Implement add to chat */
                                }}
                                className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
                              >
                                <MessageSquare size={10} />
                                Add to Chat
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setChatVisible((prev) => !prev)}
                                className={`h-6 px-2 text-[10px] ${chatVisible ? "bg-blue-500/20 text-blue-200" : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"} flex items-center gap-1`}
                              >
                                <MessageSquare size={10} />
                                {chatVisible ? "Hide AI" : "Show AI"}
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 text-xs opacity-70">
                            <div className="bg-black/10 p-2 rounded mt-2 h-full overflow-y-auto">
                              ...
                            </div>
                          </div>
                        </div>
                      </ResizablePanel>
                      {chatVisible && (
                        <>
                          <ResizableHandle withHandle />
                          <ResizablePanel defaultSize={40} minSize={30}>
                            <InlineChatPanel />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>
                  ) : activeSection === "performance" ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      <ResizablePanel
                        defaultSize={chatVisible ? 60 : 100}
                        minSize={40}
                        className="h-full"
                      >
                        <div className="p-3 text-white/70 text-sm h-full flex flex-col">
                          <div className="font-medium mb-2 text-white flex justify-between items-center">
                            <span>Performance Metrics</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  /* TODO: Implement add to chat */
                                }}
                                className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
                              >
                                <MessageSquare size={10} />
                                Add to Chat
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setChatVisible((prev) => !prev)}
                                className={`h-6 px-2 text-[10px] ${chatVisible ? "bg-blue-500/20 text-blue-200" : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"} flex items-center gap-1`}
                              >
                                <MessageSquare size={10} />
                                {chatVisible ? "Hide AI" : "Show AI"}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-black/20 rounded p-2">
                              <div className="text-[10px] text-white/50 mb-1">
                                CPU Usage
                              </div>
                              <div className="flex items-end gap-1">
                                <div className="text-lg font-medium text-white">
                                  23%
                                </div>
                                <div className="text-[10px] text-green-400 mb-1">
                                  ↓ 2%
                                </div>
                              </div>
                            </div>
                            <div className="bg-black/20 rounded p-2">
                              <div className="text-[10px] text-white/50 mb-1">
                                Memory
                              </div>
                              <div className="flex items-end gap-1">
                                <div className="text-lg font-medium text-white">
                                  1.2GB
                                </div>
                                <div className="text-[10px] text-red-400 mb-1">
                                  ↑ 50MB
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden flex flex-col gap-3">
                            <div>
                              <div className="text-xs font-medium mb-1.5 text-white/90">
                                Resource Timeline
                              </div>
                              <div className="bg-black/20 rounded-lg h-32 p-2">
                                <div className="h-full flex items-center justify-center text-xs text-white/40">
                                  Chart coming soon...
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium mb-1.5 text-white/90">
                                Active Processes
                              </div>
                              <div className="space-y-1">
                                <div className="bg-black/20 rounded p-2 flex items-center justify-between">
                                  <div className="text-xs">Main Process</div>
                                  <div className="text-[10px] text-white/50">
                                    120MB
                                  </div>
                                </div>
                                <div className="bg-black/20 rounded p-2 flex items-center justify-between">
                                  <div className="text-xs">Renderer</div>
                                  <div className="text-[10px] text-white/50">
                                    450MB
                                  </div>
                                </div>
                                <div className="bg-black/20 rounded p-2 flex items-center justify-between">
                                  <div className="text-xs">GPU Process</div>
                                  <div className="text-[10px] text-white/50">
                                    280MB
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ResizablePanel>
                      {chatVisible && (
                        <>
                          <ResizableHandle withHandle />
                          <ResizablePanel defaultSize={40} minSize={30}>
                            <InlineChatPanel />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>
                  ) : activeSection === "more" ? (
                    <div className="p-3 text-white/70 text-sm h-full">
                      <div className="font-medium mb-2 text-white">
                        Additional Tools
                      </div>
                      <div className="text-xs opacity-70">...</div>
                    </div>
                  ) : activeSection === "settings" ? (
                    <div className="p-3 text-white/70 text-sm h-full flex flex-col">
                      <div className="font-medium mb-3 text-white flex justify-between items-center">
                        <span>Settings</span>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2 text-xs text-white/90">
                              Toolbar Items
                            </h4>
                            <div suppressHydrationWarning className="space-y-1">
                              {DEFAULT_TOOLBAR_ITEMS.map((item) => (
                                <label
                                  key={item.id}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={visibleToolbarItems.includes(
                                      item.id,
                                    )}
                                    onChange={() =>
                                      handleToggleToolbarItem(item.id)
                                    }
                                    className="rounded border-white/20 bg-white/10 checked:bg-blue-500 checked:border-0 transition-colors"
                                  />
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className={`transition-colors ${visibleToolbarItems.includes(item.id) ? "text-white" : "text-white/50 group-hover:text-white/70"}`}
                                    >
                                      {item.icon}
                                    </span>
                                    <span
                                      className={`text-xs transition-colors ${visibleToolbarItems.includes(item.id) ? "text-white" : "text-white/50 group-hover:text-white/70"}`}
                                    >
                                      {item.label}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-white/10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10"
                              onClick={() =>
                                setVisibleToolbarItems(
                                  DEFAULT_TOOLBAR_ITEMS.map((item) => item.id),
                                )
                              }
                            >
                              Reset to Default
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            {isPanelVisible && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 text-white/50 hover:text-white hover:bg-white/10 rounded-sm z-10"
                onClick={closeActiveSection}
                aria-label="Close section"
              >
                <X size={14} />
              </Button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {recordingState === "error" && error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-red-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-md shadow-lg text-xs flex items-center gap-2"
        >
          <span>Error: {error}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => {
              setError(null);
              setRecordingState("idle");
            }}
          >
            <X size={12} />
          </Button>
        </motion.div>
      )}

      {playingRecording && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex justify-center items-center z-[1000] p-5">
          <div className="relative w-[90%] h-[90%] max-w-6xl max-h-[80vh] bg-black/50 rounded-lg overflow-hidden shadow-2xl">
            <video
              key={playingRecording.id}
              src={playingRecording.url}
              controls
              autoPlay
              className="block w-full h-full object-contain rounded-lg"
            />
            <Button
              onClick={handleClosePlayer}
              aria-label="Close video player"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white z-10"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
