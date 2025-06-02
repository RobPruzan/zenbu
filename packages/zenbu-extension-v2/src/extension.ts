import * as vscode from "vscode";
import { SidebarProvider } from "./providers/sidebar-provider";
import { EditorProvider } from "./providers/editor-provider";

export function activate(context: vscode.ExtensionContext) {
  // Register sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  // Create editor provider instance
  const editorProvider = new EditorProvider(context.extensionUri, context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("zenbu.openSidebar", () => {
      vscode.commands.executeCommand("workbench.view.extension.zenbu-sidebar");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("zenbu.openInEditor", () => {
      editorProvider.openInEditor();
    })
  );
}

export function deactivate() {}
