import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

/** Every table stamps `created_at` / `updated_at` in the DB, never from the app. */
const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" }).default(now).notNull();

export const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .default(now)
    .$onUpdate(() => new Date())
    .notNull();
