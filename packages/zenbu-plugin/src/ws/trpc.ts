import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { AppRouter, appRouter } from "zenbu-app";
import superjson from "superjson";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/trpc",
      transformer: superjson,
    }),
  ],
});
