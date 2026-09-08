import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

/**
 * @see https://orm.drizzle.team/docs/sqlite/guides/timestamp-default-value#sqlite
 *
 * エポックミリ秒の整数を記録する
 * SQLiteには日付型は存在しない
 */
const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" }).default(now).notNull();

export const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .default(now)
    .$onUpdate(() => new Date())
    .notNull();
