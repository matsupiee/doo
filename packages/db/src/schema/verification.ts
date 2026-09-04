import { createId } from "@paralleldrive/cuid2";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";

export const verification = sqliteTable(
  "verification",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
