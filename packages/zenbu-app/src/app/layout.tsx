import "src/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ChatProvider } from "src/components/chat-interface";
import { TRPCReactProvider } from "src/trpc/react";
import { unstable_ViewTransition as ViewTransition } from "react";
import { AppSwitcherStateProvider } from "src/components/app-switcher-context";
import { WorkspaceCommandMenu } from "./[workspaceId]/command-menu";
import { cn } from "src/lib/utils";
import { TopBar } from "./[workspaceId]/workspace-top-bar";

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
        {/* <ViewTransition default="fast-fade"> */}
        <TRPCReactProvider>
          <AppSwitcherStateProvider>
            {/* <InspectorStateProvider> */}
            {/* this is literally just for the textarea input, so dumb */}
            <ChatProvider>
              <WorkspaceCommandMenu />

              <div
        className={cn([
          "flex flex-col h-[100vh] w-[100vw] relative py-2",
          "bg-gradient-to-b from-[#080808cb] to-[#11111172]",
        ])}
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />

        <TopBar />
        <div className="flex w-full justify-between">
        {children}
          {/* <Workspace workspace={workspace} />
          <WorkspaceChat /> */}
        </div>
        {/* <BottomBar/> */}
      </div>

        
            </ChatProvider>
            {/* </InspectorStateProvider> */}
          </AppSwitcherStateProvider>
        </TRPCReactProvider>
        {/* </ViewTransition> */}
      </body>
    </html>
  );
}
