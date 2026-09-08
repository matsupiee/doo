import { createId } from "@paralleldrive/cuid2";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { post } from "./post";

/**
 * 達成したこと自体を別テーブルにすることで、共同達成を表現できるようにする
 */
export const missionCompletion = sqliteTable("mission_completion", {
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
   */
  postId: text("post_id").references(() => post.id, { onDelete: "set null" }),
  /**
   * データ記録のタイミングと実際の達成タイミングを分けるためにカラムを設ける
   * createdAt と同じになることが多い想定
   */
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
});
