import * as vscode from "vscode";
import { createBirpc } from "birpc";
import type { ExtensionRPC, WebviewRPC } from "./types";

export function createExtensionRPC(
  webview: vscode.Webview,
  context: vscode.ExtensionContext
) {
  const extensionFunctions: ExtensionRPC = {
    executeCommand: async (command, ...args) => {
      return await vscode.commands.executeCommand(command, ...args);
    },

    showInformationMessage: async (message, ...items) => {
      return await vscode.window.showInformationMessage(message, ...items);
    },

    showErrorMessage: async (message, ...items) => {
      return await vscode.window.showErrorMessage(message, ...items);
    },

    showWarningMessage: async (message, ...items) => {
      return await vscode.window.showWarningMessage(message, ...items);
    },

    showQuickPick: async (items, options) => {
      return await vscode.window.showQuickPick(items, options);
    },

    showInputBox: async (options) => {
      return await vscode.window.showInputBox(options);
    },

    openExternal: async (uri) => {
      return await vscode.env.openExternal(vscode.Uri.parse(uri));
    },

    openInEditor: async () => {
      await vscode.commands.executeCommand("zenbu.openInEditor");
    },

    openSidebar: async () => {
      await vscode.commands.executeCommand("zenbu.openSidebar");
    },

    getState: async () => {
      return context.globalState.get("zenbuState", {});
    },

    setState: async (state) => {
      await context.globalState.update("zenbuState", state);
    },

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

    getWorkspacePath: async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (folders && folders.length > 0) {
        return folders[0].uri.fsPath;
      }
      throw new Error("No workspace folder found");
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
