import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

import * as Schema from "src/server/db/schema";
import { db } from "src/server/db";
import { eq } from "drizzle-orm";
import { firstRecord, firstRecordAssert } from "src/server/db/utils";
export const workspaceRouter = createTRPCRouter({
  getWorkspace: publicProcedure
    .input(
      z.object({
        workspaceId: z.string(),
      }),
    )
    .query(async (opts) => {
      let workspace = await db
        .select()
        .from(Schema.workspace)
        .where(eq(Schema.workspace.workspaceId, opts.input.workspaceId))
        .then(firstRecord);

      if (!workspace) {
        workspace = await db
          .insert(Schema.workspace)
          .values({
            workspaceId: opts.input.workspaceId,
            backgroundImageUrl: null,
          })
          .returning()
          .then(firstRecordAssert);
      }

      return workspace!;
    }),
  setBackgroundImage: publicProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        backgroundImageUrl: z.string(),
      }),
    )
    .mutation(async (opts) => {
      await db
        .update(Schema.workspace)
        .set({
          backgroundImageUrl: opts.input.backgroundImageUrl,
        })
        .where(eq(Schema.workspace.workspaceId, opts.input.workspaceId));
    }),
});
