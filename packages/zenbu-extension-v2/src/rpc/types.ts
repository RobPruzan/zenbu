import * as vscode from "vscode";

export interface ExtensionRPC {
  executeCommand: (command: string, ...args: any[]) => Promise<any>;

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

  showQuickPick: (
    items: string[],
    options?: vscode.QuickPickOptions
  ) => Promise<string | undefined>;

  showInputBox: (
    options?: vscode.InputBoxOptions
  ) => Promise<string | undefined>;

  openExternal: (uri: string) => Promise<boolean>;

  openInEditor: () => Promise<void>;
  openSidebar: () => Promise<void>;

  getState: () => Promise<any>;
  setState: (state: any) => Promise<void>;

  getWorkspaceFolders: () => Promise<string[]>;
  openTextDocument: (uri: string) => Promise<void>;


  getWorkspacePath: () => Promise<string>
}

export interface WebviewRPC {
  updateData: (data: any) => void;

  onThemeChanged: (theme: string) => void;
}
 