import * as vscode from "vscode";
import { BaseWebviewProvider } from "./base-provider";
import { createExtensionRPC } from "../rpc/extension-rpc";

export class EditorProvider {
  private panel?: vscode.WebviewPanel;
  private _rpc?: ReturnType<typeof createExtensionRPC>;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

  public async openInEditor() {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (this.panel) {
      this.panel.reveal(columnToShowIn);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "zenbu.editor",
      "Zenbu",
      columnToShowIn || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          this.extensionUri,
          vscode.Uri.joinPath(this.extensionUri, "dist", "webview"),
          vscode.Uri.joinPath(this.extensionUri, "webview"),
          vscode.Uri.joinPath(this.extensionUri, "node_modules"),
        ],
      }
    );

    // Set up BiRPC
    this._rpc = createExtensionRPC(this.panel.webview, this.context);

    this.panel.webview.html = this._getHtmlForWebview(this.panel.webview);

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this._rpc = undefined;
    });
  }

  protected _getHtmlForWebview(webview: vscode.Webview): string {
    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // Development mode with Vite HMR
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenbu</title>
    <script type="module">
        // React Refresh preamble - must be before React loads
        import RefreshRuntime from 'http://localhost:7857/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="http://localhost:7857/@vite/client"></script>
    <link rel="stylesheet" href="http://localhost:7857/styles.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="http://localhost:7857/editor-main.tsx"></script>
</body>
</html>`;
    }

    // Production mode
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "editor.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "editor.css")
    );

    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Zenbu</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
