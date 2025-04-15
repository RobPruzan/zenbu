import { z } from "zod";

export const baseClientMessageEventSchema = z.object({
  id: z.string(),
  kind: z.literal("user-message"),
  context: z.array(
    z.union([
      z.object({ kind: z.literal("image"), filePath: z.string() }),
      z.object({ kind: z.literal("video"), filePath: z.string() }),
    ])
  ),
  text: z.string(),
  requestId: z.string(),
  timestamp: z.number(),
});
// need to add project id /whatever identifier on the type

export type ClientMessageEvent = z.infer<
  typeof baseClientMessageEventSchema
> & {
  previousEvents: Array<EventLogEvent>;
};

const clientMessageEventSchema: z.ZodType<ClientMessageEvent> =
  baseClientMessageEventSchema.extend({
    previousEvents: z.lazy(() => clientMessageEventSchema.array()),
  });

export const baseClientTaskEventSchema = z.object({
  id: z.string(),
  kind: z.literal("user-task"),
  context: z.any(),
  text: z.string(),
  requestId: z.string(),
  timestamp: z.number(),
});

export type ClientTaskEvent = z.infer<typeof baseClientTaskEventSchema> & {
  previousEvents: Array<EventLogEvent>;
};

const clientTaskEventSchema: z.ZodType<ClientTaskEvent> =
  baseClientTaskEventSchema.extend({
    previousEvents: z.lazy(() => z.array(z.lazy(() => clientTaskEventSchema))),
  });

export const pluginServerEventSchema = z.object({
  id: z.string(),
  kind: z.literal("assistant-simple-message"),
  text: z.string(),
  associatedRequestId: z.string(),
  timestamp: z.number(),
  threadId: z.string().nullable(),
});

export type PluginServerEvent = z.infer<typeof pluginServerEventSchema>;

export const eventLogEventSchema = z.union([
  pluginServerEventSchema,
  clientTaskEventSchema,
  clientMessageEventSchema,
]);
export type EventLogEvent = z.infer<typeof eventLogEventSchema>;
