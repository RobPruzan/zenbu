import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { posts } from "~/server/db/schema";

export const daemonRouter = createTRPCRouter({
  getProjects: publicProcedure.query(async ({ input }) => {
    const json = await fetch("http://localhost:40000/projects").then((res) =>
      res.json(),
    );
    const schema = z.object({
      name: z.string(),
      port: z.number(),
      pid: z.number(),
      cwd: z.string(),
    });
    const data = z.array(schema).parse(json);
    return data;
  }),

  createProject: publicProcedure.mutation(async ({ ctx }) => {
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
    })
});
