import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { InspectorStateProvider } from "./iframe-wrapper";

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
    <InspectorStateProvider>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className="antialiased">{children}</body>
      </html>
    </InspectorStateProvider>
  );
}
