import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { AppRouter, appRouter } from "zenbu-app";
import superjson from "superjson";

// type inference doesn't work without the current specific tsconfig, good to know in the future
// will need to bisect which opt did it
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
      transformer: superjson,
    }),
  ],
});
