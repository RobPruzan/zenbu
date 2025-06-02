import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "webview"),
  server: {
    port: 7857,
    cors: {
      origin: "*",
      credentials: true,
    },
    hmr: {
      host: "localhost",
      protocol: "ws",
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/webview"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidebar: path.resolve(__dirname, "webview/sidebar.html"),
        editor: path.resolve(__dirname, "webview/editor.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "[name].css";
          }
          return "assets/[name]-[hash].[ext]";
        },
      },
    },
  },
  css: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "webview"),
      "~": path.resolve(__dirname, "../zenbu-app/src"),
      src: path.resolve(__dirname, "../zenbu-app/src"),
      "src/lib/utils": path.resolve(__dirname, "webview/utils.ts"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "src/lib/trpc": path.resolve(__dirname, "webview/shims/trpc-shim.ts"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "class-variance-authority",
      "@radix-ui/react-slot",
      "clsx",
      "tailwind-merge",
      "birpc",
    ],
    exclude: ["zenbu-app"],
  },
});
