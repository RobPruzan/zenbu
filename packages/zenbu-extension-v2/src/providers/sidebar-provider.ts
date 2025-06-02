import * as vscode from "vscode";
import { BaseWebviewProvider } from "./base-provider";

export class SidebarProvider
  extends BaseWebviewProvider
  implements vscode.WebviewViewProvider
{
  private _view?: vscode.WebviewView;

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(
      webviewView.webview,
      "sidebar"
    );

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "openInEditor":
            vscode.commands.executeCommand("zenbu.openInEditor");
            break;
          case "alert":
            vscode.window.showInformationMessage(message.text);
            break;
        }
      },
      undefined,
      this.disposables
    );

    webviewView.onDidDispose(
      () => {
        this._view = undefined;
      },
      undefined,
      this.disposables
    );
  }

  public postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }
}
