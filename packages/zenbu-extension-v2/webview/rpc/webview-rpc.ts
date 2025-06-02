import { createBirpc } from "birpc";
import type { ExtensionRPC, WebviewRPC } from "../../src/rpc/types";
import { getVSCodeAPI } from "../vscode-api";

declare global {
  interface Window {
    __rpcInstance?: ReturnType<typeof createBirpc<ExtensionRPC, WebviewRPC>>;
  }
}

export function getWebviewRPC() {
  if (!window.__rpcInstance) {
    const vscode = getVSCodeAPI();

    // Webview-side implementations (functions the extension can call)
    const webviewFunctions: WebviewRPC = {
      updateData: (data) => {
        // Handle data updates from extension
        console.log("Received data from extension:", data);
      },

      onThemeChanged: (theme) => {
        // Handle theme changes
        console.log("Theme changed:", theme);
      },
    };

    window.__rpcInstance = createBirpc<ExtensionRPC, WebviewRPC>(
      webviewFunctions,
      {
        post: (data) => {
          vscode.postMessage({ type: "rpc", data });
        },
        on: (fn) => {
          const handler = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === "rpc") {
              fn(message.data);
            }
          };
          window.addEventListener("message", handler);
          return () => window.removeEventListener("message", handler);
        },
      }
    );
  }

  return window.__rpcInstance;
}

// Export a convenient API object
export const vscodeAPI = new Proxy({} as ExtensionRPC, {
  get(_, prop: string) {
    const rpc = getWebviewRPC();
    return (rpc as any)[prop];
  },
});
