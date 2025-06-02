import * as vscode from "vscode";
import { BaseWebviewProvider } from "./base-provider";

export class SidebarProvider extends BaseWebviewProvider {
  public static readonly viewType = "zenbu.sidebar";

  protected _getHtmlForWebview(webview: vscode.Webview): string {
    return this._getWebviewContent(webview, "sidebar-main.tsx");
  }
}
