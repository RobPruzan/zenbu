/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./webview-src/**/*.{js,ts,jsx,tsx}", "./webview-src/index.html"],
  theme: {
    extend: {
      colors: {
        // VS Code theme colors
        vscode: {
          foreground: "var(--vscode-foreground)",
          background: "var(--vscode-editor-background)",
          "sidebar-bg": "var(--vscode-sideBar-background)",
          border: "var(--vscode-widget-border)",
          hover: "var(--vscode-toolbar-hoverBackground)",
          button: {
            bg: "var(--vscode-button-background)",
            fg: "var(--vscode-button-foreground)",
            hover: "var(--vscode-button-hoverBackground)",
            "secondary-bg": "var(--vscode-button-secondaryBackground)",
            "secondary-fg": "var(--vscode-button-secondaryForeground)",
          },
          input: {
            bg: "var(--vscode-input-background)",
            fg: "var(--vscode-input-foreground)",
            border: "var(--vscode-input-border)",
            placeholder: "var(--vscode-input-placeholderForeground)",
          },
          focus: "var(--vscode-focusBorder)",
          description: "var(--vscode-descriptionForeground)",
          link: "var(--vscode-textLink-activeForeground)",
          progress: "var(--vscode-progressBar-background)",
        },
      },
      fontFamily: {
        vscode: "var(--vscode-font-family)",
        editor: "var(--vscode-editor-font-family)",
      },
      fontSize: {
        "vscode-sm": "11px",
        vscode: "13px",
        "vscode-lg": "14px",
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "pulse-dot": "pulseDot 1.4s infinite",
      },
      keyframes: {
        slideIn: {
          from: { opacity: "0", transform: "translateX(10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 60%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "30%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
