import { relations } from "drizzle-orm";
import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { missionCompletion } from "./mission-completion";
import { user } from "./user";

/**
 * 1件の達成を「誰が」達成したか。
 * 1行なら個人達成、複数行なら共同達成として記録される。
 */
export const missionCompletionParticipant = sqliteTable(
  "mission_completion_participant",
  {
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    completionId: text("completion_id")
      .notNull()
      .references(() => missionCompletion.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.completionId, table.userId],
    }),
    /** プロフィールの「達成したこと」一覧を引くため。 */
    index("missionCompletionParticipant_userId_idx").on(table.userId),
  ],
);

export const missionCompletionParticipantRelations = relations(
  missionCompletionParticipant,
  ({ one }) => ({
    completion: one(missionCompletion, {
      fields: [missionCompletionParticipant.completionId],
      references: [missionCompletion.id],
    }),
    user: one(user, {
      fields: [missionCompletionParticipant.userId],
      references: [user.id],
    }),
  }),
);
