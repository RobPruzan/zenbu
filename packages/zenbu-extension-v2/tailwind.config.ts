import type { Config } from "tailwindcss";
import baseConfig from "../zenbu-app/tailwind.config";

export default {
  ...baseConfig,
  content: [
    "./webview/**/*.{js,ts,jsx,tsx}",
    "../zenbu-app/src/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config;
