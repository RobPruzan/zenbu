import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Plugin to fix output structure
function fixOutputStructure() {
  return {
    name: "fix-output-structure",
    writeBundle() {
      // The post-build script will handle moving files
    },
  };
}

export default defineConfig({
  plugins: [react(), fixOutputStructure()],
  root: path.resolve(__dirname, "webview-src"),
  build: {
    outDir: path.resolve(__dirname, "out/webview"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "webview-src/index.html"),
      output: {
        entryFileNames: "webview.js",
        chunkFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'webview.css';
          }
          return '[name].[ext]';
        },
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "webview-src"),
    },
  },
});
 