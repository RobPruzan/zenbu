import * as vscode from "vscode";
import { createBirpc } from "birpc";
import type { ExtensionRPC, WebviewRPC } from "./types";

export function createExtensionRPC(
  webview: vscode.Webview,
  context: vscode.ExtensionContext
) {
  // Extension-side implementations
  const extensionFunctions: ExtensionRPC = {
    // Commands
    executeCommand: async (command, ...args) => {
      return await vscode.commands.executeCommand(command, ...args);
    },

    // Window API
    showInformationMessage: async (message, ...items) => {
      return await vscode.window.showInformationMessage(message, ...items);
    },

    showErrorMessage: async (message, ...items) => {
      return await vscode.window.showErrorMessage(message, ...items);
    },

    showWarningMessage: async (message, ...items) => {
      return await vscode.window.showWarningMessage(message, ...items);
    },

    // Quick Pick
    showQuickPick: async (items, options) => {
      return await vscode.window.showQuickPick(items, options);
    },

    // Input Box
    showInputBox: async (options) => {
      return await vscode.window.showInputBox(options);
    },

    // Open External
    openExternal: async (uri) => {
      return await vscode.env.openExternal(vscode.Uri.parse(uri));
    },

    // Custom commands
    openInEditor: async () => {
      await vscode.commands.executeCommand("zenbu.openInEditor");
    },

    // State management
    getState: async () => {
      return context.globalState.get("zenbuState", {});
    },

    setState: async (state) => {
      await context.globalState.update("zenbuState", state);
    },

    // Workspace
    getWorkspaceFolders: async () => {
      const folders = vscode.workspace.workspaceFolders;
      return folders ? folders.map((f) => f.uri.fsPath) : [];
    },

    openTextDocument: async (uri) => {
      const doc = await vscode.workspace.openTextDocument(
        vscode.Uri.parse(uri)
      );
      await vscode.window.showTextDocument(doc);
    },
  };

  const rpc = createBirpc<WebviewRPC, ExtensionRPC>(extensionFunctions, {
    post: (data) => {
      webview.postMessage({ type: "rpc", data });
    },
    on: (fn) => {
      const disposable = webview.onDidReceiveMessage((message) => {
        if (message.type === "rpc") {
          fn(message.data);
        }
      });
      return () => disposable.dispose();
    },
  });

  return rpc;
}
