import * as vscode from "vscode";

// Extension-side functions that webviews can call
export interface ExtensionRPC {
  // Commands
  executeCommand: (command: string, ...args: any[]) => Promise<any>;

  // Window API
  showInformationMessage: (
    message: string,
    ...items: string[]
  ) => Promise<string | undefined>;
  showErrorMessage: (
    message: string,
    ...items: string[]
  ) => Promise<string | undefined>;
  showWarningMessage: (
    message: string,
    ...items: string[]
  ) => Promise<string | undefined>;

  // Quick Pick
  showQuickPick: (
    items: string[],
    options?: vscode.QuickPickOptions
  ) => Promise<string | undefined>;

  // Input Box
  showInputBox: (
    options?: vscode.InputBoxOptions
  ) => Promise<string | undefined>;

  // Open External
  openExternal: (uri: string) => Promise<boolean>;

  // Custom commands
  openInEditor: () => Promise<void>;
  openSidebar: () => Promise<void>;

  // State management
  getState: () => Promise<any>;
  setState: (state: any) => Promise<void>;

  // Workspace
  getWorkspaceFolders: () => Promise<string[]>;
  openTextDocument: (uri: string) => Promise<void>;
}

// Webview-side functions that extension can call
export interface WebviewRPC {
  // For sending data to webview
  updateData: (data: any) => void;

  // Theme changes
  onThemeChanged: (theme: string) => void;
}
 