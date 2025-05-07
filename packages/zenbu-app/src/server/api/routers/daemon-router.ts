import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "src/server/db";
import * as Schema from "src/server/db/schema";
import { iife } from "src/lib/utils";
import { Project } from "zenbu-daemon";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { daemonRPC } from "src/app/editor/[projectName]/rpc";
// import { daemonRPC } from "src/app/rpc";

export const daemonRouter = createTRPCRouter({
  getProjects: publicProcedure.query(async () => {
    // some abstraction for this pattern will probably be needed
    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const { projects } = yield* Effect.tryPromise(() =>
          daemonRPC["get-projects"].$post().then((res) => res.json()),
        );
        return projects;
      }),
    );

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
  }),

  createProject: publicProcedure
    .input(
      z.object({
        workspaceId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const { project } = yield* Effect.tryPromise(() =>
            daemonRPC["create-project"].$post().then((res) => res.json()),
          );
          return project;
        }),
      );

      switch (exit._tag) {
        case "Success": {
          const record = await db
            .insert(Schema.tag)
            .values({
              fromProjectId: exit.value.name,
              toWorkspaceId: opts.input.workspaceId,
            })
            .returning();

          console.log("record", record);

          return exit.value;
        }
        case "Failure": {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: exit.toString(),
          });
        }
      }
    }),
  deleteProject: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async (opts) => {
      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          yield* Effect.tryPromise(() =>
            daemonRPC["delete-project"]
              .$post({
                json: {
                  name: opts.input.name,
                },
              })
              .then((res) => res.json()),
          );
          return;
          // return Schema.project;
        }),
      );

      switch (exit._tag) {
        case "Success": {
          return { success: true };
        }
        case "Failure": {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: exit.toString(),
          });
        }
      }
    }),

  killProject: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async (opts) => {
      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          yield* Effect.tryPromise(() =>
            daemonRPC["kill-project"]
              .$post({
                json: {
                  name: opts.input.name,
                },
              })
              .then((res) => res.json()),
          );
          // return Schema.project;
        }),
      );

      switch (exit._tag) {
        case "Success": {
          return { success: true };
        }
        case "Failure": {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: exit.toString(),
          });
        }
      }
    }),

  nuke: publicProcedure.mutation(async () => {
    await daemonRPC.nuke.$post();
  }),
  startProject: publicProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async (opts) => {
      // some abstraction for this pattern will probably be needed
      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const projects = yield* Effect.tryPromise(() =>
            daemonRPC["start-project"]
              .$post({
                json: {
                  name: opts.input.name,
                },
              })
              .then((res) => res.json()),
          );
          return projects;
        }),
      );

      switch (exit._tag) {
        case "Success": {
          return exit.value.project;
        }
        case "Failure": {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: exit.toString(),
          });
        }
      }
    }),
});
