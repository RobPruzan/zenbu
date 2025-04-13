

import {
	QueriesOptions,
	Query,
	QueryClient,
	QueryKey,
	QueryOptions,
	matchQuery,
	queryOptions,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { UseTRPCQueryResult } from "@trpc/react-query/shared";
import superjson from "superjson";
import { AppRouter } from "~/server/api/root";

export function getBaseUrl() {
	return "";
}

export const trpc = createTRPCNext<AppRouter>({
	transformer: superjson,
	config(opts) {
		return {
			links: [
				httpBatchLink({
					url: `${getBaseUrl()}/api/trpc`,
					transformer: superjson,
				}),
			],
		};
	},

	ssr: false,
	overrides: {
		useMutation: {
			/**
			 * This function is called whenever a `.useMutation` succeeds
			 **/
			async onSuccess(opts) {
				const nonStaticQueries = (query: Query) => {
					const defaultStaleTime = opts.queryClient.getQueryDefaults(query.queryKey).staleTime ?? 0;
					const staleTimes = query.observers
						.map((observer) => observer.options.staleTime)
						.filter((staleTime) => staleTime !== undefined) as Array<number>;

					if (staleTimes.length === 0) {
						return true;
					}

					const staleTime = query.getObserversCount() > 0 ? Math.min(...staleTimes) : defaultStaleTime;

					return staleTime !== Number.POSITIVE_INFINITY;
				};
				/**
				 * @note that order here matters:
				 * The order here allows route changes in `onSuccess` without
				 * having a flash of content change whilst redirecting.
				 **/

				await opts.originalFn();
				if (opts.meta.noInvalidate) {
					return;
				}
				// if manual revalidation is provided, use it over invalidating all
				if (Object.keys(opts.meta).length > 0) {
					await opts.queryClient.invalidateQueries({
						predicate: (query) => {
							const invalidatesPredicate =
								(opts.meta?.invalidates as Array<QueryKey>)?.some((queryKey) => matchQuery({ queryKey }, query)) ??
								true;
							return invalidatesPredicate && nonStaticQueries(query);
						},
					});
					return;
				}
				await opts.queryClient.invalidateQueries({
					predicate: nonStaticQueries,
				});
			},
		},
	},
});
