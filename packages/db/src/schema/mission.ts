import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { assignment } from "./assignment";
import { missionCategory } from "./mission-category";
import { post } from "./post";
import { relay } from "./relay";

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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    title: text("title").notNull(),
    description: text("description"),
    /** Free-form hint of what proof looks like, e.g. "動画で撮って". */
    proofHint: text("proof_hint"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("mission_creatorId_idx").on(table.creatorId)],
);

export const missionRelations = relations(mission, ({ one, many }) => ({
  creator: one(user, { fields: [mission.creatorId], references: [user.id] }),
  assignments: many(assignment),
  posts: many(post),
  relays: many(relay),
  categories: many(missionCategory),
}));
