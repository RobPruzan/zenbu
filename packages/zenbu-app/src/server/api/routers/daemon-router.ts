import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "src/server/db";
import * as Schema from "src/server/db/schema";
import { iife } from "src/lib/utils";

export const daemonRouter = createTRPCRouter({
  getProjects: publicProcedure.query(async ({ input }) => {
    const jsonPromise = fetch("http://localhost:40000/projects").then((res) =>
      res.json(),
    );
    const schema = z.object({
      name: z.string(),
      port: z.number(),
      pid: z.number(),
      cwd: z.string(),
    });

    const [json, projects] = await Promise.all([
      jsonPromise,
      db.select().from(Schema.project),
    ]);

    const data = z.array(schema).parse(json);
    console.log("data vs projects", data, projects);

    const withId = data.map((item) => ({
      ...item,
      id: iife(() => {
        const project = projects.find((project) => project.name === item.name);
        if (!project) {
          return null;
          // throw new Error(
          //   "Invariant: must map perfectly, something went wrong upstream",
          // );
        }

        return project.projectId;
      }),
    }));
    return withId.filter((i) => !!i.id);
  }),

  createProject: publicProcedure.mutation(async ({ ctx }) => {
    console.log("creating project?");

    const startTime = performance.now();

    const json = await fetch("http://localhost:40000/projects", {
      method: "POST",
    }).then((res) => res.json());

    const schema = z.object({
      name: z.string(),
      port: z.number(),
      pid: z.number(),
      cwd: z.string(),
    });

    const data = schema.parse(json);

    const endTime = performance.now();
    console.log(`Project creation took ${endTime - startTime}ms`);

    return data;
  }),
  deleteProject: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async (opts) => {
      const json = await fetch(
        `http://localhost:40000/projects/${opts.input.name}`,
        {
          method: "DELETE",
        },
      ).then((res) => res.json());
      const schema = z.object({
        name: z.string(),
        port: z.number(),
        pid: z.number(),
        cwd: z.string(),
      });
      const data = schema.parse(json);
      return data;
    }),
  resumeProject: publicProcedure.input(z.object({})).mutation(() => {
    // once we impl resuming and dead/alive states
  }),
});
