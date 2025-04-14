import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "src/server/db";
import { firstRecordAssert, firstRecord } from "src/server/db/utils";
import { eventLogEventSchema } from "zenbu-plugin/src/ws/ws";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as Schema from "src/server/db/schema";
// import * as Schema from "../db/schema.ts"
// import { db } from "src/server/";

// import * as Schema from "~/server";

// i should make a schema shim for this too ngl
// how do drizzle schemas work if u inline a type? hm
export const chatRouter = createTRPCRouter({
  createProject: publicProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const project = await db
        .insert(Schema.project)
        .values({
          name: opts.input.name,
        })
        .returning()
        .then(firstRecordAssert);

      const projectChat = await db.insert(Schema.projectChat).values({
        projectId: project.projectId,
        events: [],
      });
      return {
        project,
        projectChat,
      };
    }),
  persistEvent: publicProcedure
    .input(
      z.object({
        event: eventLogEventSchema,
        projectChatId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const projectChat = await db
        .select()
        .from(Schema.projectChat)
        .where(eq(Schema.project.projectId, opts.input.projectChatId))
        .then(firstRecord);
      if (!projectChat) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No project chat with id provided",
        });
      }

      const _ = await db
        .update(Schema.projectChat)
        .set({
          // todo: is there a way to just push the data to the json buffer
          events: [...projectChat.events, opts.input.event],
        })
        .where(eq(Schema.projectChat.projectChatId, projectChat.projectChatId));
    }),
});
