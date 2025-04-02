import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Metadata } from "next";
import { TRPCReactProvider } from "~/trpc/react";
import { ChatProvider } from "~/components/chat-interface";
import { NavBar } from "~/components/nav-bar";

export const metadata: Metadata = {
  title: "Zenbu",
  description: "The zenbu app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <div className="full-width-height">
          <TRPCReactProvider>
            {/* <InspectorStateProvider> */}
              <ChatProvider>
                <NavBar />
                {children}
              </ChatProvider>
            {/* </InspectorStateProvider> */}
          </TRPCReactProvider>
        </div>
      </body>
    </html>
  );
}
