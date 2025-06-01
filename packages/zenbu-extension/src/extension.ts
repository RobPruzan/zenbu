import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

class TestAIViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "test-ai.webview";

  private _view?: vscode.WebviewView;
  private _extensionPath: string;
  private _fileWatcher?: fs.FSWatcher;
  private _panel?: vscode.WebviewPanel;
  private _context?: vscode.ExtensionContext;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    extensionPath: string,
    context?: vscode.ExtensionContext
  ) {
    this._extensionPath = extensionPath;
    this._context = context;
  }

  public openInPanel() {
    // Create or show panel
    if (this._panel) {
      this._panel.reveal();
    } else {
      this._panel = vscode.window.createWebviewPanel(
        "test-ai.panel",
        "Zenbu Tools",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this._extensionUri, "out", "webview"),
          ],
        }
      );

      this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

      // Set the view context for editor
      this._panel.webview.postMessage({
        type: "setContext",
        viewContext: "editor",
      });

      // Handle messages from the panel webview
      this._panel.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case "popOutChat":
            this._openChatInEditor(message.messages);
            break;
          case "openInEditor":
            this._openCodeInEditor(message.code, message.filename);
            break;
          case "syncState":
            // Sync state between sidebar and panel
            if (this._view) {
              this._view.webview.postMessage({
                type: "syncState",
                state: message.state,
              });
            }
            break;
          case "syncToSidebar":
            // Sync from editor back to sidebar
            if (this._view) {
              this._view.webview.postMessage({
                type: "syncMessages",
                messages: message.messages,
                projectId: message.projectId,
              });
            }
            break;
          case "focusSidebar":
            // Show the sidebar
            vscode.commands.executeCommand(
              "workbench.view.extension.zenbu-sidebar"
            );
            break;
          case "openBrowser":
            // Open URL in browser
            const url = message.url || "http://localhost:3000";
            console.log(`Opening browser with URL: ${url}`);
            vscode.env.openExternal(vscode.Uri.parse(url)).then(
              (success) => {
                if (!success) {
                  vscode.window.showErrorMessage(`Failed to open ${url}`);
                }
              },
              (error) => {
                vscode.window.showErrorMessage(
                  `Error opening browser: ${error.message}`
                );
              }
            );
            break;
        }
      });

      // Handle panel disposal
      this._panel.onDidDispose(() => {
        this._panel = undefined;
      });

      // Set up file watching for hot reload in development
      if (process.env.NODE_ENV === "development") {
        this.setupPanelFileWatcher(this._panel);
      }
    }
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
        vscode.Uri.joinPath(this._extensionUri, "out", "webview"),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Set the view context
    webviewView.webview.postMessage({
      type: "setContext",
      viewContext: "sidebar",
    });

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "popOutChat":
          // Instead of creating a markdown file, open in panel
          this.openInPanel();
          break;
        case "openInEditor":
          // Open with full context in the editor panel
          this.openInPanel();
          // Pass the context to the panel
          if (this._panel) {
            this._panel.webview.postMessage({
              type: "loadContext",
              messages: message.messages,
              project: message.project,
            });
          }
          break;
        case "openTool":
          // Open a specific tool in the editor
          this.openToolInEditor(
            message.toolId,
            message.projectId,
            message.messages
          );
          break;
        case "openToolInNewTab":
          // Open tool directly in a new tab (finished product)
          this.openToolInNewTab(
            message.toolId,
            message.projectId,
            message.messages
          );
          break;
        case "openBrowser":
          // Open URL in browser
          const url = message.url || "http://localhost:3000";
          console.log(`Opening browser with URL: ${url}`);
          vscode.env.openExternal(vscode.Uri.parse(url)).then(
            (success) => {
              if (!success) {
                vscode.window.showErrorMessage(`Failed to open ${url}`);
              }
            },
            (error) => {
              vscode.window.showErrorMessage(
                `Error opening browser: ${error.message}`
              );
            }
          );
          break;
      }
    });

    // Set up file watching for hot reload
    if (process.env.NODE_ENV === "development") {
      this.setupFileWatcher(webviewView);
    }

    // Clean up watcher on dispose
    webviewView.onDidDispose(() => {
      if (this._fileWatcher) {
        this._fileWatcher.close();
      }
    });
  }

  private setupFileWatcher(webviewView: vscode.WebviewView) {
    const webviewPath = path.join(this._extensionPath, "out", "webview");
    const buildStatusPath = path.join(
      this._extensionPath,
      "out",
      ".build-status"
    );
    let lastBuildStartTime = 0;

    // Watch for build status changes
    const checkBuildStatus = () => {
      try {
        if (fs.existsSync(buildStatusPath)) {
          const status = JSON.parse(fs.readFileSync(buildStatusPath, "utf-8"));
          // Only send build start notifications, not end
          // The indicator will disappear when the webview reloads
          if (
            status.building &&
            status.timestamp > lastBuildStartTime &&
            this._view
          ) {
            lastBuildStartTime = status.timestamp;
            this._view.webview.postMessage({
              type: "buildStatus",
              building: true,
            });
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Check build status periodically
    const statusInterval = setInterval(checkBuildStatus, 100);

    // Watch the webview output directory
    this._fileWatcher = fs.watch(
      webviewPath,
      { recursive: true },
      (eventType, filename) => {
        if (
          filename &&
          (filename.endsWith(".js") ||
            filename.endsWith(".css") ||
            filename === "index.html")
        ) {
          console.log(`Webview file changed: ${filename}`);

          // Debounce reloads
          if (this._reloadTimeout) {
            clearTimeout(this._reloadTimeout);
          }

          this._reloadTimeout = setTimeout(() => {
            if (this._view) {
              // Force reload by setting HTML again
              this._view.webview.html = this._getHtmlForWebview(
                this._view.webview
              );
              // The reload will naturally clear the build indicator
            }
          }, 100);
        }
      }
    );

    // Clean up on dispose
    webviewView.onDidDispose(() => {
      clearInterval(statusInterval);
    });
  }

  private _reloadTimeout?: NodeJS.Timeout;

  private _getHtmlForWebview(webview: vscode.Webview) {
    const htmlPath = path.join(
      this._extensionPath,
      "out",
      "webview",
      "index.html"
    );

    // Check if built files exist
    if (!fs.existsSync(htmlPath)) {
      return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test AI</title>
            <style>
              body {
                padding: 20px;
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
              }
            </style>
        </head>
        <body>
            <h2>Build Required</h2>
            <p>Please run <code>npm run build-webview</code> to build the webview files.</p>
            <p>Then reload the window with <code>Cmd+R</code> or <code>Ctrl+R</code>.</p>
        </body>
        </html>`;
    }

    let html = fs.readFileSync(htmlPath, "utf-8");

    // Update paths to use webview URIs
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionPath, "out", "webview", "webview.js")
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionPath, "out", "webview", "webview.css")
      )
    );

    // Replace script src - handle both absolute and relative paths
    html = html.replace(
      /<script\s+type="module"\s+crossorigin\s+src="[^"]+webview\.js"><\/script>/,
      `<script type="module" src="${scriptUri}"></script>`
    );

    // Replace CSS link - handle both absolute and relative paths
    html = html.replace(
      /<link\s+rel="stylesheet"\s+crossorigin\s+href="[^"]+webview\.css">/,
      `<link rel="stylesheet" href="${styleUri}">`
    );

    // Add a cache buster to force reload
    html = html.replace(
      "</head>",
      `<meta name="cache-buster" content="${Date.now()}">\n</head>`
    );

    return html;
  }

  private _openChatInEditor(messages: any[]) {
    // Create a new untitled document with the chat content
    const content = messages
      .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
      .join("\n\n---\n\n");

    vscode.workspace
      .openTextDocument({
        content,
        language: "markdown",
      })
      .then((doc) => {
        vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
      });
  }

  private _openCodeInEditor(code: string, filename: string) {
    // Create a new untitled document with the extension code
    const language = filename.endsWith(".ts") ? "typescript" : "javascript";

    vscode.workspace
      .openTextDocument({
        content: code,
        language,
      })
      .then((doc) => {
        vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
      });
  }

  private setupPanelFileWatcher(panel: vscode.WebviewPanel) {
    const webviewPath = path.join(this._extensionPath, "out", "webview");
    const buildStatusPath = path.join(
      this._extensionPath,
      "out",
      ".build-status"
    );
    let lastBuildStartTime = 0;
    let reloadTimeout: NodeJS.Timeout | undefined;

    // Watch for build status changes
    const checkBuildStatus = () => {
      try {
        if (fs.existsSync(buildStatusPath)) {
          const status = JSON.parse(fs.readFileSync(buildStatusPath, "utf-8"));
          if (
            status.building &&
            status.timestamp > lastBuildStartTime &&
            this._panel
          ) {
            lastBuildStartTime = status.timestamp;
            this._panel.webview.postMessage({
              type: "buildStatus",
              building: true,
            });
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Check build status periodically
    const statusInterval = setInterval(checkBuildStatus, 100);

    // Watch the webview output directory
    const watcher = fs.watch(
      webviewPath,
      { recursive: true },
      (eventType, filename) => {
        if (
          filename &&
          (filename.endsWith(".js") ||
            filename.endsWith(".css") ||
            filename === "index.html")
        ) {
          console.log(`Panel webview file changed: ${filename}`);

          // Debounce reloads
          if (reloadTimeout) {
            clearTimeout(reloadTimeout);
          }

          reloadTimeout = setTimeout(() => {
            if (this._panel) {
              this._panel.webview.html = this._getHtmlForWebview(
                this._panel.webview
              );
            }
          }, 100);
        }
      }
    );

    // Clean up on dispose
    panel.onDidDispose(() => {
      clearInterval(statusInterval);
      watcher.close();
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
    });
  }

  private openToolInEditor(
    toolId: string,
    projectId: string,
    messages?: any[]
  ) {
    // Ensure panel is open
    this.openInPanel();

    // Send tool data to the editor
    if (this._panel) {
      this._panel.webview.postMessage({
        type: "loadTool",
        toolId,
        projectId,
        messages: messages || [], // Include chat messages
        config: {}, // Tool-specific configuration
      });
    }
  }

  private openToolInNewTab(
    toolId: string,
    projectId: string,
    messages?: any[]
  ) {
    // Create a new panel specifically for this tool
    const toolPanel = vscode.window.createWebviewPanel(
      `zenbu-tool-${toolId}`,
      this.getToolTitle(toolId),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, "out", "webview"),
        ],
      }
    );

    // Set the HTML
    toolPanel.webview.html = this._getHtmlForWebview(toolPanel.webview);

    // Tell the webview to load directly as the tool
    toolPanel.webview.postMessage({
      type: "loadToolDirect",
      toolId,
      projectId,
      messages: messages || [],
    });

    // Handle messages from the tool
    toolPanel.webview.onDidReceiveMessage((message) => {
      if (message.command === "focusSidebar") {
        vscode.commands.executeCommand(
          "workbench.view.extension.zenbu-sidebar"
        );
      }
    });
  }

  private getToolTitle(toolId: string): string {
    const titles: Record<string, string> = {
      "sidebar-preview": "Sidebar Extension",
      "decorator-preview": "Code Decorators",
      "hover-preview": "Hover Providers",
      "command-tester": "Command Tester",
      "theme-builder": "Theme Builder",
    };
    return titles[toolId] || "Zenbu Tool";
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Test AI Extension is now active!");

  const provider = new TestAIViewProvider(
    context.extensionUri,
    context.extensionPath,
    context
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TestAIViewProvider.viewType,
      provider
    )
  );

  // Command to open sidebar
  let openSidebarCommand = vscode.commands.registerCommand(
    "test-ai.openWebview",
    () => {
      vscode.commands.executeCommand("test-ai.webview.focus");
    }
  );

  // Command to open in panel/tab
  let openPanelCommand = vscode.commands.registerCommand(
    "test-ai.openInPanel",
    () => {
      provider.openInPanel();
    }
  );

  context.subscriptions.push(openSidebarCommand);
  context.subscriptions.push(openPanelCommand);
}

export function deactivate() {}
