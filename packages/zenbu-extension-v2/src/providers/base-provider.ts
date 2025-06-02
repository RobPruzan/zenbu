import * as vscode from "vscode";
import * as path from "path";
import { createExtensionRPC } from "../rpc/extension-rpc";

export abstract class BaseWebviewProvider
  implements vscode.WebviewViewProvider
{
  protected _view?: vscode.WebviewView;
  protected _context: vscode.ExtensionContext;
  protected _rpc?: ReturnType<typeof createExtensionRPC>;

  constructor(
    protected readonly extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._context = context;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.extensionUri,
        vscode.Uri.joinPath(this.extensionUri, "dist", "webview"),
        vscode.Uri.joinPath(this.extensionUri, "webview"),
        vscode.Uri.joinPath(this.extensionUri, "node_modules"),
      ],
    };

    // Set up BiRPC
    this._rpc = createExtensionRPC(webviewView.webview, this._context);

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  protected abstract _getHtmlForWebview(webview: vscode.Webview): string;

  protected _getWebviewContent(
    webview: vscode.Webview,
    scriptName: string
  ): string {
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
    <script type="module" src="http://localhost:7857/${scriptName}"></script>
</body>
</html>`;
    }

    // Production mode
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "dist",
        "webview",
        `${scriptName.replace(".tsx", ".js")}`
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "dist",
        "webview",
        `${scriptName.replace(".tsx", ".css")}`
      )
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
