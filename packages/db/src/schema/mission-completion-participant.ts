import { relations } from "drizzle-orm";
import { foreignKey, index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { missionCompletion } from "./mission-completion";
import { missionParticipant } from "./mission-participant";
import { user } from "./user";

/**
 * 1件の達成を「誰が」達成したか。
 * 1行なら個人達成、複数行なら共同達成として記録される。
 *
 * 達成した人は、そのミッションの参加者でなければならない。
 * これを DB で担保するために mission_id を持ち、複合 FK を2本張っている。
 *
 * - (completion_id, mission_id) -> mission_completion (id, mission_id)
 * - (mission_id, user_id)       -> mission_participant (mission_id, user_id)
 *
 * mission_id が両方の FK に登場することで、「達成のミッション」と「参加している
 * ミッション」が同じ1つの値に固定される。user_id だけを持って
 * mission_participant を指す形だと、別のミッションの参加者行を指せてしまう。
 */
export const missionCompletionParticipant = sqliteTable(
  "mission_completion_participant",
  {
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    completionId: text("completion_id").notNull(),
    /** 参照整合性のために持つ。値は必ず mission_completion.mission_id と一致する。 */
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.completionId, table.userId],
    }),
    foreignKey({
      columns: [table.completionId, table.missionId],
      foreignColumns: [missionCompletion.id, missionCompletion.missionId],
      name: "mission_completion_participant_completion_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.missionId, table.userId],
      foreignColumns: [missionParticipant.missionId, missionParticipant.userId],
      name: "mission_completion_participant_participant_fk",
    }).onDelete("cascade"),
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
    participant: one(missionParticipant, {
      fields: [
        missionCompletionParticipant.missionId,
        missionCompletionParticipant.userId,
      ],
      references: [missionParticipant.missionId, missionParticipant.userId],
    }),
    user: one(user, {
      fields: [missionCompletionParticipant.userId],
      references: [user.id],
    }),
  }),
);
