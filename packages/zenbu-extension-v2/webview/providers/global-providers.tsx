import React from "react";
import { TRPCProvider } from "./trpc-provider";
import { ChatProvider } from "~/components/chat-interface";
import { AppSwitcherStateProvider } from "~/components/app-switcher-context";

interface GlobalProvidersProps {
  children: React.ReactNode;
}

export function GlobalProviders({ children }: GlobalProvidersProps) {
  return (
    <TRPCProvider>
      <AppSwitcherStateProvider>
        <ChatProvider>{children}</ChatProvider>
      </AppSwitcherStateProvider>
    </TRPCProvider>
  );
}
