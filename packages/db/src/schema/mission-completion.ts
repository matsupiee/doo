import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { missionCompletionParticipant } from "./mission-completion-participant";
import { post } from "./post";

/**
 * 達成したこと自体を別テーブルにすることで、共同達成を表現できるようにする
 * 誰が達成したかは mission_completion_participant が持つ。
 * 1人だけなら個人達成、複数人なら共同達成。
 */
export const missionCompletion = sqliteTable(
  "mission_completion",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    /**
     * 達成時には必ずpostを行うようにする
     * 投稿が消えたら達成の記録も残せないので cascade。
     */
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    /**
     * データ記録のタイミングと実際の達成タイミングを分けるためにカラムを設ける
     * createdAt と同じになることが多い想定
     */
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("mission_completion_missionId_idx").on(table.missionId),
    index("mission_completion_completedAt_idx").on(table.completedAt),
    /** 1つの投稿が2つの達成を表すことはない。 */
    uniqueIndex("mission_completion_postId_uidx").on(table.postId),
  ],
);

export const missionCompletionRelations = relations(missionCompletion, ({ one, many }) => ({
  mission: one(mission, {
    fields: [missionCompletion.missionId],
    references: [mission.id],
  }),
  post: one(post, {
    fields: [missionCompletion.postId],
    references: [post.id],
  }),
  participants: many(missionCompletionParticipant),
}));
