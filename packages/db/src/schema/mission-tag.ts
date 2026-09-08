import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { relations } from "drizzle-orm";

export const missionTag = sqliteTable(
  "mission_tag",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
  },
  (table) => [
    index("mission_tag_missionId_idx").on(table.missionId),
    index("mission_tag_title_idx").on(table.title),
    uniqueIndex("mission_and_mission_tag_uidx").on(
      table.missionId,
      table.title,
    ),
  ],
);

export const missionTagRelations = relations(missionTag, ({ one }) => ({
  mission: one(mission, {
    fields: [missionTag.missionId],
    references: [mission.id],
  }),
}));
