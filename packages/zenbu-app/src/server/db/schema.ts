import { integer, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { createTable } from "./utils";
// import { EventLogEvent } from "zenbu-plugin/src/ws/schemas";

const date = (name: string) => integer(name, { mode: "timestamp" });

const idCol = (name?: string) => text(name ?? "id").$defaultFn(nanoid);
const primaryIdCol = (name?: string) => idCol(name).primaryKey();
const createdAtCol = () =>
  date("created_at")
    .notNull()
    .$defaultFn(() => new Date());

export const workspace = createTable("workspace", {
  workspaceId: primaryIdCol("workspaceId"),
  // probably should normalize the segment but it's fine
  backgroundImageUrl: text("backgroundImageUrl"),
  createdAt: createdAtCol(),
});
