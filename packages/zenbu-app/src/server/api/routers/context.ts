// /* eslint-disable @typescript-eslint/no-unused-vars */
// import type * as trpcNext from "@trpc/server/adapters/next";
// import { makeRedisClient } from "../../../../../zenbu-redis/src/redis";

// // eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface CreateContextOptions {
// 	client: ReturnType<typeof makeRedisClient>;
// }

// /**
//  * Inner function for `createContext` where we create the context.
//  * This is useful for testing when we don't want to mock Next.js' request/response
//  */
// export function createContextInner(_opts?: CreateContextOptions) {
// 	return {
// 		client: makeRedisClient({tcp:true}),
// 	};
// }

// export type Context = Awaited<ReturnType<typeof createContextInner>>;

// /**
//  * Creates context for an incoming request
//  * @see https://trpc.io/docs/v11/context
//  */
// export async function createContext(opts: trpcNext.CreateNextContextOptions): Promise<Context> {
// 	// for API-response caching see https://trpc.io/docs/v11/caching

// 	return await createContextInner();
// }
