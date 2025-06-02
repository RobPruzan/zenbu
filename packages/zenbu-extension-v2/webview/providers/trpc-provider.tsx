import React from "react";
import { TRPCReactProvider } from "~/trpc/react";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider baseUrl="http://localhost:3000">
      {children}
    </TRPCReactProvider>
  );
}
