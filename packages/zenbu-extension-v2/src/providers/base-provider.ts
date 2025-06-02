import * as vscode from "vscode";

export abstract class BaseWebviewProvider {
  protected disposables: vscode.Disposable[] = [];

  constructor(protected context: vscode.ExtensionContext) {}

  protected getHtmlForWebview(
    webview: vscode.Webview,
    scriptName: string
  ): string {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const port = 7857;
    const nonce = this.getNonce();

    if (isDevelopment) {
      return this.getDevHtml(webview, scriptName, port, nonce);
    } else {
      return this.getProdHtml(webview, scriptName, nonce);
    }
  }

  private getDevHtml(
    webview: vscode.Webview,
    scriptName: string,
    port: number,
    nonce: string
  ): string {
    const csp = [
      `default-src 'none'`,
      `script-src 'unsafe-eval' 'unsafe-inline' http://localhost:${port}`,
      `style-src 'unsafe-inline' http://localhost:${port}`,
      `img-src 'self' data: https://* http://localhost:${port}`,
      `font-src 'self' http://localhost:${port}`,
      `connect-src https://* ws://localhost:${port} http://localhost:${port}`,
    ].join("; ");

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <script>const vscode = acquireVsCodeApi();</script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
            import RefreshRuntime from 'http://localhost:${port}/@react-refresh'
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
          </script>
          <script type="module" src="http://localhost:${port}/@vite/client"></script>
          <script type="module" src="http://localhost:${port}/${scriptName}-main.tsx"></script>
        </body>
      </html>`;
  }

  private getProdHtml(
    webview: vscode.Webview,
    scriptName: string,
    nonce: string
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "webview",
        `${scriptName}.js`
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "webview",
        `${scriptName}.css`
      )
    );

    const csp = [
      `default-src 'none'`,
      `script-src 'nonce-${nonce}'`,
      `style-src ${webview.cspSource} 'self' 'unsafe-inline'`,
      `img-src 'self' data: https://* ${webview.cspSource}`,
      `font-src ${webview.cspSource}`,
    ].join("; ");

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <link rel="stylesheet" href="${styleUri}">
          <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }

  private getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  dispose() {
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
