import { createId } from "@paralleldrive/cuid2";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { user } from "./user";

export const session = sqliteTable(
  "session",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);
