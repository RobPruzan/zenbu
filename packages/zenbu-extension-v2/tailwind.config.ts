import type { Config } from "tailwindcss";
import baseConfig from "../zenbu-app/tailwind.config";

export default {
  ...baseConfig,
  content: [
    "./webview/**/*.{js,ts,jsx,tsx}",
    "../zenbu-app/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme?.extend,
      colors: {
        ...baseConfig.theme?.extend?.colors,
        // Override with RGB values for opacity support
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        input: "rgb(var(--input-rgb) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted-rgb) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
    },
  },
} satisfies Config;
