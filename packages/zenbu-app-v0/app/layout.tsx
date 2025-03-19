import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { InspectorStateProvider } from "./iframe-wrapper";
import { ChatProvider } from "@/components/chat-interface";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zenbu",
  description: "AI-powered web builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <InspectorStateProvider>
            <ChatProvider>{children}</ChatProvider>
          </InspectorStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
