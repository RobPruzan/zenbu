import * as vscode from "vscode";
import { BaseWebviewProvider } from "./base-provider";

export class EditorProvider extends BaseWebviewProvider {
  private panel?: vscode.WebviewPanel;

  public createOrShow() {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (this.panel) {
      this.panel.reveal(column);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "zenbuEditor",
      "Zenbu Editor",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this.context.extensionUri],
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getHtmlForWebview(
      this.panel.webview,
      "editor"
    );

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "alert":
            vscode.window.showInformationMessage(message.text);
            break;
          case "openFile":
            const doc = await vscode.workspace.openTextDocument(message.path);
            vscode.window.showTextDocument(doc);
            break;
        }
      },
      undefined,
      this.disposables
    );

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      this.disposables
    );
  }

  public postMessage(message: any) {
    if (this.panel) {
      this.panel.webview.postMessage(message);
    }
  }
}
