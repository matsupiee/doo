import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { postReaction } from "./post-reaction";

export const postMediaType = ["photo", "video", "text"] as const;

/**
 * feed投稿を行うための機能
 * ミッション達成時は必ず投稿される
 * ミッション達成してない場合の進捗報告投稿などもできる
 */
export const post = sqliteTable(
  "post",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type", { enum: postMediaType })
      .default("text")
      .notNull(),
    /** Null for text-only proof. */
    mediaUrl: text("media_url"),
    caption: text("caption"),
  },
  (table) => [
    index("post_authorId_idx").on(table.authorId),
    index("post_createdAt_idx").on(table.createdAt),
  ],
);

export const postRelations = relations(post, ({ one, many }) => ({
  mission: one(mission, { fields: [post.missionId], references: [mission.id] }),
  author: one(user, { fields: [post.authorId], references: [user.id] }),
  reactions: many(postReaction),
}));
