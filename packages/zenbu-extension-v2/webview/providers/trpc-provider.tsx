import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { api, createTRPCClient } from "../lib/trpc";
import { createQueryClient } from "../lib/query-client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}
