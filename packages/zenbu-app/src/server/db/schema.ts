import { integer, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { EventLogEvent } from "zenbu-plugin/src/ws/ws";
import { createTable } from "./utils";

const date = (name: string) => integer(name, { mode: "timestamp" });

const idCol = (name?: string) => text(name ?? "id").$defaultFn(nanoid);
const primaryIdCol = (name?: string) => idCol(name).primaryKey();
const createdAtCol = () =>
  date("created_at")
    .notNull()
    .$defaultFn(() => new Date());

export const project = createTable("project", {
  projectId: primaryIdCol("projectId"),
  name: text("name").notNull(),
});

export const projectChat = createTable("projectChat", {
  projectChatId: primaryIdCol("projectChatId"),
  projectId: text("projectId")
    .notNull()
    .references(() => project.projectId),
  events: text("events", { mode: "json" })
    .$type<Array<EventLogEvent>>()
    .notNull(),
  createdAt: createdAtCol(),

  // hm this feels weird to make a schema for chat?
  // i don't really want to make a general json object a plugin has to store
  // it would be nice if every plugin had the ability to make their own sqlite
  // and to access the global?
  // permissions?
  // what if we build out everything, see how things interact and then make the abstraction?
  // sounds good to me
});

// export const projectChatEvent = createTable("projectChatEvent", {
//   projectChatEventId: createPrimaryId("projectChatEventId"),
//   projectChatId: text("projectChatId")
//     .notNull()
//     .references(() => projectChat.projectChatId),
//   text: text("text").notNull(),

// });

/**
 *
 * err so how do I want to model dis
 *
 * I need project scoped shit and global scoped shit
 *
 *
 * I don't really care about users at all, I don't think right?
 *
 * I guess adding that on top shouldn't really be a pain hopefully
 *
 * whatever that's something so into the future that I won't be implementing so not worth imagining a setup that's easier to model that in the future
 *
 *
 * nice that we can kind of build everything that's been pissing me off
 *
 * So do we want local storage persistence or db always persistence
 *
 * well internet not a concern, so probably just always have it modeled correctly in db,
 * that way I can query it arbitrarily
 *
 *
 */
