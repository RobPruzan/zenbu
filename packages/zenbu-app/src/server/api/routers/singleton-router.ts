import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

import * as Schema from "src/server/db/schema";
import { db } from "src/server/db";
import { eq } from "drizzle-orm";
import { firstRecord, firstRecordAssert } from "src/server/db/utils";
import { Effect } from "effect";
import { daemonRPC } from "src/app/sunset/[projectName]/rpc";
import { iife } from "src/lib/utils";
import { TRPCError } from "@trpc/server";
export const persistedSingletonRouter = createTRPCRouter({
  setCurrentProjectId: publicProcedure
    .input(z.object({ currentProjectId: z.string() }))
    .mutation(async (opts) => {
      const existing = await db
        .select()
        .from(Schema.persistedSingleton)
        .then(firstRecord);

      if (existing) {
        await db
          .update(Schema.persistedSingleton)
          .set({ currentProjectId: opts.input.currentProjectId });
      } else {
        await db
          .insert(Schema.persistedSingleton)
          .values({ currentProjectId: opts.input.currentProjectId });
      }
    }),
  getCurrentProjectId: publicProcedure.query(async () => {
    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const { projects } = yield* Effect.tryPromise(() =>
          daemonRPC["get-projects"].$post().then((res) => res.json()),
        );
        return projects;
      }),
    );
    const projects = iife(() => {
      switch (exit._tag) {
        case "Success": {
          return exit.value;
        }
        case "Failure": {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: exit.toString(),
          });
        }
      }
    })
    const singleton = await db
      .select()
      .from(Schema.persistedSingleton)
      .then(firstRecord);
    
    let currentWorkspaceId = singleton?.currentWorkspaceId;
    
    if (!currentWorkspaceId) {
      currentWorkspaceId = "home";
      if (singleton) {
        await db
          .update(Schema.persistedSingleton)
          .set({ currentWorkspaceId });
      } else {
        await db
          .insert(Schema.persistedSingleton)
          .values({ currentWorkspaceId });
      }
    }

    if (singleton?.currentProjectId) {
      const projectExists = projects.some(project => project.name === singleton.currentProjectId);
      if (projectExists) {
        return singleton.currentProjectId;
      } else {
        const defaultProjectId = projects[0].name;
        await db
          .update(Schema.persistedSingleton)
          .set({ currentProjectId: defaultProjectId });
        return defaultProjectId;
      }
    }

    if (projects.length === 0) {
      throw new Error("No projects available");
    }

    const defaultProjectId = projects[0].name;
    
    if (singleton) {
      await db
        .update(Schema.persistedSingleton)
        .set({ currentProjectId: defaultProjectId });
    } else {
      await db
        .insert(Schema.persistedSingleton)
        .values({ currentProjectId: defaultProjectId, currentWorkspaceId });
    }

    return defaultProjectId;
  }),
  setCurrentWorkspaceId: publicProcedure
    .input(z.object({ currentWorkspaceId: z.string() }))
    .mutation(async (opts) => {
      const existing = await db
        .select()
        .from(Schema.persistedSingleton)
        .then(firstRecord);

      if (existing) {
        await db
          .update(Schema.persistedSingleton)
          .set({ currentWorkspaceId: opts.input.currentWorkspaceId });
      } else {
        await db
          .insert(Schema.persistedSingleton)
          .values({ currentWorkspaceId: opts.input.currentWorkspaceId });
      }
    }),
  getCurrentWorkspaceId: publicProcedure.query(async () => {
    const singleton = await db
      .select()
      .from(Schema.persistedSingleton)
      .then(firstRecord);
    
    if (singleton?.currentWorkspaceId) {
      return singleton.currentWorkspaceId;
    }

    const workspaceId = "home";
    if (singleton) {
      await db
        .update(Schema.persistedSingleton)
        .set({ currentWorkspaceId: workspaceId });
    } else {
      await db
        .insert(Schema.persistedSingleton)
        .values({ currentWorkspaceId: workspaceId });
    }
    
    return workspaceId;
  }),
});
