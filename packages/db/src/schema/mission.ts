import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { user } from "./user";

/**
 * A mission is the "do this thing" template: a title plus what counts as doing it.
 * It is created once and can be handed to any number of people through assignments.
 */
export const mission = sqliteTable(
  "mission",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    /** Free-form hint of what proof looks like, e.g. "動画で撮って". */
    proofHint: text("proof_hint"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("mission_creatorId_idx").on(table.creatorId)],
);
