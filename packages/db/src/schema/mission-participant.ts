import { text, primaryKey, index, sqliteTable } from "drizzle-orm/sqlite-core";
import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { missionCompletionParticipant } from "./mission-completion-participant";

export const missionParticipant = sqliteTable(
  "mission_participant",
  {
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.missionId, table.userId] }),
    index("missionParticipant_userId_idx").on(table.userId),
  ],
);

export const missionParticipantRelations = relations(
  missionParticipant,
  ({ one, many }) => ({
    mission: one(mission, {
      fields: [missionParticipant.missionId],
      references: [mission.id],
    }),
    user: one(user, {
      fields: [missionParticipant.userId],
      references: [user.id],
    }),
    /** この参加者としての達成。参加をやめると達成の記録も消える点に注意。 */
    completionParticipations: many(missionCompletionParticipant),
  }),
);
