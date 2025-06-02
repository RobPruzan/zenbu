# Zenbu Extension V2

A VSCode extension with hot-reloading React webviews, featuring both sidebar and editor views.

## Features

- **Sidebar View**: Accessible via the activity bar icon
- **Editor View**: Opens in the main editor area
- **Hot Reloading**: Instant updates during development
- **Tailwind CSS**: Shared styles with zenbu-app components

## Development

1. Install dependencies:

```bash
npm install
```

2. Start development mode:

```bash
npm run dev
```

This will:

- Start the extension bundler (tsup) in watch mode
- Start the Vite dev server for hot-reloading webviews
- Open a new VSCode window with the extension loaded

## Project Structure

```
packages/zenbu-extension-v2/
├── src/
│   ├── extension.ts          # Extension entry point
│   └── providers/            # Webview providers
│       ├── base-provider.ts  # Base class with hot-reload support
│       ├── sidebar-provider.ts
│       └── editor-provider.ts
├── webview/
│   ├── sidebar.tsx          # Sidebar React component
│   ├── editor.tsx           # Editor React component
│   ├── styles.css           # Tailwind imports
│   ├── sidebar.html         # Vite entry points
│   └── editor.html
├── media/
│   └── icon.svg             # Extension icon
└── dist/                    # Build output
```

## How It Works

### Hot Reloading

In development mode (`NODE_ENV=development`), the extension serves webview content from the Vite dev server running on port 7857. This enables:

- Instant updates when you modify React components
- HMR (Hot Module Replacement) for state preservation
- Fast refresh for React components

### Production Build

In production, the extension serves bundled assets from the `dist/webview` directory with proper CSP headers.

### Tailwind Integration

The extension shares Tailwind configuration and components from `zenbu-app`:

- Components are imported using the `~` alias (e.g., `~/components/ui/button`)
- Tailwind scans both local webview files and zenbu-app components for classes

## Building for Production

```bash
npm run build
```

This creates optimized bundles in the `dist` directory.

## Testing

1. Press `F5` in VSCode to launch a new Extension Development Host
2. Click the Zenbu icon in the activity bar to open the sidebar
3. Use the "Open in Editor" button to open the editor view
4. Make changes to the React components and see them update instantly
