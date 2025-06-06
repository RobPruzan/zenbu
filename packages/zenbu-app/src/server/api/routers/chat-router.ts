import { TRPCError } from "@trpc/server";
import { Data, identity, Effect } from "effect";
import { eq } from "drizzle-orm";
import { db } from "src/server/db";
import { firstRecordAssert, firstRecord } from "src/server/db/utils";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as Schema from "src/server/db/schema";
import { eventLogEventSchema } from "zenbu-plugin/src/ws/schemas";
import { daemonRPC } from "src/app/rpc";
import { RedisContext } from "../../../../../zenbu-redis/src/redis";
// import * as Schema from "../db/schema.ts"
// import { db } from "src/server/";

// i should make a schema shim for this too ngl
// how do drizzle schemas work if u inline a type? hm
// or fetch the projects, then prefetch all events, then fetch the events
// okay i out my foot down a project should only have one chat, gyat.
export const chatRouter = createTRPCRouter({
  getEvents: publicProcedure
    .input(
      z.object({
        projectName: z.string(),
      }),
    )
    .query(async (opts) => {
      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const { client } = yield* RedisContext;
          const events = yield* client.effect.getChatEvents(opts.input.projectName);
          return events;
        }).pipe(
          Effect.provideService(RedisContext, { client: opts.ctx.redis }),
        ),
      );

      switch (exit._tag) {
        case "Success":
          return exit.value;
        case "Failure":
          throw new TRPCError({
            code: "BAD_REQUEST",
            cause: exit.cause,
          });
      }
    }),
  persistEvent: publicProcedure.input(z.object({})).mutation((opts) => {
    const exit = Effect.runPromiseExit(
      Effect.gen(function* () {
        const { client } = yield* RedisContext;
        /**
         *
         * blah blah persist it
         */
      }).pipe(Effect.provideService(RedisContext, { client: opts.ctx.redis })),
    );
  }),
  // getEvents: publicProcedure
  //   .input(
  //     z.object({
  //       projectId: z.string(),
  //     }),
  //   )
  //   .query(async (opts) => {
  //     const project = await db
  //       .select()
  //       .from(Schema.projectChat)
  //       .where(eq(Schema.projectChat.projectChatId, opts.input.projectId))
  //       .then(firstRecord);

  //     if (!project) {
  //       throw new TRPCError({
  //         code: "BAD_REQUEST",
  //         message: "Project with that id does not exist",
  //       });
  //     }

  //     return project.events;
  //   }),
  // persistEvent: publicProcedure
  //   .input(
  //     z.object({
  //       event: eventLogEventSchema,
  //       projectId: z.string(),
  //     }),
  //   )
  //   .mutation(async (opts) => {
  //     console.log("someone trying to persist an event", opts.input.projectId);
  //     // fetch project, check if chat exists, if not create, if does update it
  //     const project = await db
  //       .select()
  //       .from(Schema.project)
  //       .where(eq(Schema.project.projectId, opts.input.projectId))
  //       .then(firstRecord);

  //     if (!project) {
  //       throw new TRPCError({
  //         code: "BAD_REQUEST",
  //         message:
  //           "Project with that id does not exist:" + opts.input.projectId,
  //       });
  //     }

  //     let projectChat = await db
  //       .select()
  //       .from(Schema.projectChat)
  //       .where(eq(Schema.projectChat.projectId, opts.input.projectId))
  //       .then(firstRecord);

  //     if (!projectChat) {
  //       projectChat = await db
  //         .insert(Schema.projectChat)
  //         .values({
  //           projectId: opts.input.projectId,
  //           events: [opts.input.event],
  //         })
  //         .returning()
  //         .then(firstRecordAssert);
  //     } else {
  //       await db
  //         .update(Schema.projectChat)
  //         .set({
  //           events: [...projectChat.events, opts.input.event],
  //         })
  //         .where(
  //           eq(Schema.projectChat.projectChatId, projectChat.projectChatId),
  //         );
  //     }
  //   }),
});
