export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  actions?: Array<{
    type: string;
    label: string;
    [key: string]: any;
  }>;
}

export interface ExtensionProject {
  id: string;
  name: string;
  type: "command" | "sidebar" | "panel" | "statusbar" | "hover" | "completion";
  description: string;
  code: string;
  createdAt: Date;
  lastModified: Date;
  isActive: boolean;
}

export type TabType = "chat" | "preview" | "library";
export type ChatMode = "full" | "split";

// Canvas Types - Different UI layouts for different extension patterns
export type CanvasType =
  | "chat" // AI chat interface
  | "visual" // Visual editor (decorators, themes)
  | "command" // Command/shortcut builder
  | "devtools" // DevTools-style inspector
  | "preview" // Live preview canvas
  | "diff"; // Code diff viewer

export interface Canvas {
  id: string;
  type: CanvasType;
  title: string;
  icon: string;
  position: "main" | "sidebar" | "panel" | "floating";
  state: Record<string, any>;
}

// Extension Pattern Types
export type ExtensionPattern =
  | "sidebar-tool" // Sidebar panels (file explorer, git, etc)
  | "decorator" // Code decorators (git blame, colors, etc)
  | "command-palette" // Command-based (vim, emmet)
  | "hover-provider" // Hover information
  | "code-actions" // Quick fixes, refactoring
  | "theme" // Color themes
  | "language-support" // Syntax, completion
  | "debugger" // Debug adapters
  | "terminal" // Terminal integrations
  | "notebook"; // Notebook renderers

export interface ExtensionBlueprint {
  id: string;
  name: string;
  pattern: ExtensionPattern;
  description: string;
  requiredCanvases: CanvasType[];
  optionalCanvases: CanvasType[];
  capabilities: string[];
  aiPrompt?: string; // Pre-configured AI prompt for this pattern
}

// Version Control
export interface ExtensionVersion {
  id: string;
  projectId: string;
  version: string;
  timestamp: Date;
  changes: Change[];
  snapshot: ExtensionSnapshot;
  aiExplanation?: string;
}

export interface Change {
  type: "add" | "modify" | "delete";
  path: string;
  before?: string;
  after?: string;
  description: string;
}

export interface ExtensionSnapshot {
  files: Record<string, string>;
  configuration: Record<string, any>;
  dependencies: Record<string, string>;
}

// Workspace Layout
export interface WorkspaceLayout {
  id: string;
  name: string;
  canvases: {
    canvas: Canvas;
    gridArea: string; // CSS Grid area
    visible: boolean;
  }[];
  activeCanvas?: string;
}

// Live Preview System
export interface PreviewContext {
  type: "sidebar" | "editor" | "hover" | "decoration" | "command";
  mockData?: any;
  targetFile?: string;
  position?: { line: number; character: number };
}

// AI Assistant Context
export interface AIContext {
  currentPattern: ExtensionPattern;
  activeCanvases: Canvas[];
  recentChanges: Change[];
  userIntent: string;
  constraints?: string[];
}
