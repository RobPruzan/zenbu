import { sqliteTableCreator } from "drizzle-orm/sqlite-core";

export const firstRecord = <T>(data: Array<T>) => data.at(0);
export const firstRecordAssert = <T>(data: Array<T>) => firstRecord(data)!;
export const createTable = sqliteTableCreator((name) => `zenbu-app_${name}`);
