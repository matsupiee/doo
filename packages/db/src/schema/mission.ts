import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { post } from "./post";
import { missionTag } from "./mission-tag";
import { missionParticipant } from "./mission-participant";
import { missionCompletion } from "./mission-completion";

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
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("mission_creatorId_idx").on(table.creatorId)],
);

export const missionRelations = relations(mission, ({ one, many }) => ({
  creator: one(user, { fields: [mission.creatorId], references: [user.id] }),
  posts: many(post),
  tags: many(missionTag),
  participants: many(missionParticipant),
  completions: many(missionCompletion),
}));
