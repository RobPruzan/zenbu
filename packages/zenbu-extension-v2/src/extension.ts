import * as vscode from "vscode";
import { EditorProvider } from "./providers/editor-provider";
import { SidebarProvider } from "./providers/sidebar-provider";

export function activate(context: vscode.ExtensionContext) {
  console.log("Zenbu Extension V2 is now active!");

  const sidebarProvider = new SidebarProvider(context);
  const editorProvider = new EditorProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "zenbu.sidebar",
      sidebarProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("zenbu.openSidebar", () => {
      vscode.commands.executeCommand("zenbu.sidebar.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("zenbu.openInEditor", () => {
      editorProvider.createOrShow();
    })
  );
}

export function deactivate() {}
