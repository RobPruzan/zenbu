import * as vscode from "vscode";
import { SidebarProvider } from "./providers/sidebar-provider";
import { EditorProvider } from "./providers/editor-provider";
import { createServer } from "./kyju-bridge/create-server";

let server: null | Awaited<ReturnType<typeof createServer>>;

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  const editorProvider = new EditorProvider(context.extensionUri, context);

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

  // console.log("creating server!!");
  // process.exit();

  // createServer().then((created) => {
  //   server = created;
  // });
}

export function deactivate() {
  // console.log("deactivate server!!");

  // server?.close();
}
