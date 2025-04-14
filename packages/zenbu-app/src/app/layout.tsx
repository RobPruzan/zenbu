import "src/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ChatProvider } from "src/components/chat-interface";
import { TRPCReactProvider } from "src/trpc/react";

export const metadata: Metadata = {
  title: "Zenbu",
  description: "Where you build apps",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          {/* <InspectorStateProvider> */}
          {/* this is literally just for the textarea input, so dumb */}
          <ChatProvider>{children}</ChatProvider>
          {/* </InspectorStateProvider> */}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
