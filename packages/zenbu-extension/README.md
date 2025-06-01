# Test AI - Cursor AI Assistant Extension

An AI-powered extension for Cursor (VS Code fork) that provides an intelligent assistant in the sidebar with hot reloading for rapid development.

## Features

- 🤖 **AI Assistant Interface**: Chat-like interface in the Cursor sidebar
- 🔥 **Hot Reloading**: Changes to webview code automatically reload without restarting Cursor
- 📦 **TypeScript Support**: Full TypeScript support for both extension and webview code
- 🎨 **Native Cursor UI**: Styled with Cursor theme variables for seamless integration
- 💬 **Interactive Chat**: Send messages and receive AI responses (demo implementation)
- ⚡ **Quick Actions**: Predefined actions for common coding tasks

## What It Looks Like

The extension adds a new icon in the Cursor activity bar (left sidebar). When clicked, it opens the Test AI panel with:

- A chat interface for conversing with the AI assistant
- Quick action buttons for common tasks like:
  - Explain Code
  - Generate Tests
  - Refactor Code
  - Find Bugs

## Project Structure

```
test-ai/
├── src/                    # Extension source code
│   └── extension.ts        # Main extension file with sidebar provider
├── webview-src/           # Webview source code
│   ├── index.ts           # Chat interface implementation
│   ├── styles.css         # Sidebar-optimized styles
│   └── tsconfig.json      # TypeScript config for webview
├── media/                 # Extension assets
│   └── icon.svg           # Activity bar icon
├── .vscode/               # VS Code/Cursor configuration
│   ├── launch.json        # Debug configurations
│   └── tasks.json         # Build tasks
├── webpack.config.js      # Webpack configuration for webview
├── tsconfig.json          # TypeScript configuration
└── package.json           # Node.js dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Cursor (latest version)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development script to start coding with hot reloading:

```bash
npm run dev
```

This command will:

1. Start TypeScript compiler in watch mode for the extension
2. Start webpack in watch mode for the webview
3. Open a new Cursor window with the extension loaded

**Note**: The first time you run `npm run dev`, it will compile the code but might not automatically open Cursor. After the initial compilation, run the command again or:

- Press `F5` in Cursor to launch the extension
- Or use Command Palette: `Debug: Start Debugging`

### Using the Extension

1. Look for the Test AI icon in the activity bar (left sidebar)
2. Click the icon to open the Test AI panel
3. Start chatting with the AI assistant or use the quick action buttons

## Hot Reloading

When developing:

- Changes to files in `webview-src/` will automatically trigger a webpack rebuild
- The extension detects changes to the built webview bundle and reloads the webview
- You'll see a notification "Test AI webview reloaded!" when this happens

**Note**: Changes to the extension code (`src/`) require reloading the Extension Development Host (use `Cmd+R` or `Ctrl+R` in the development Cursor window).

## Customization

### Modifying the Chat Interface

Edit files in `webview-src/`:

- `index.ts` - Add AI functionality, modify chat behavior
- `styles.css` - Adjust the sidebar styling

### Adding New Quick Actions

In `webview-src/index.ts`, add new buttons in the features section and their corresponding event handlers.

### Connecting to a Real AI Service

The current implementation is a demo. To connect to a real AI service:

1. Add API integration in `src/extension.ts`
2. Handle message passing between webview and extension
3. Process AI responses and update the chat interface

## Building for Production

To build the extension for production:

```bash
npm run vscode:prepublish
```

This will compile both the extension and webview code with production optimizations.

## Debugging

1. Set breakpoints in your extension code (`src/extension.ts`)
2. Press `F5` to start debugging
3. Use Cursor's debugging tools to step through code

For webview debugging:

1. Right-click in the webview
2. Select "Developer: Toggle Developer Tools" from the Command Palette
3. Use Chrome DevTools to debug the webview code

## Alternative: Running in VS Code

If you want to run the extension in VS Code instead of Cursor:

```bash
npm run open-vscode
```

Or modify the `dev` script in `package.json` to use `open-vscode` instead of `open-cursor`.

## Tips

- The sidebar view automatically saves and restores its state
- Use Cursor theme variables in CSS for consistent theming across different themes
- The webview uses a CSP (Content Security Policy) for security
- Messages between the webview and extension use the VS Code API

## Troubleshooting

- If hot reloading stops working, restart the dev script
- Ensure all node_modules are installed: `npm install`
- Check the "Output" panel in Cursor for extension logs
- For webview issues, check the Developer Tools console
- If Cursor command is not found, make sure Cursor is installed and the `cursor` command is available in your PATH

## License

MIT
 