import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";

// Import from the package directly to use package.json exports
import type { AppRouter } from "zenbu-app";

// Create the tRPC React client
export const api = createTRPCReact<AppRouter>();

// Create the tRPC client
export const createTRPCClient = () => {
  return api.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3000/api/trpc",
        transformer: superjson,
        headers: () => {
          return {
            "x-trpc-source": "vscode-extension",
          };
        },
      }),
    ],
  });
};
