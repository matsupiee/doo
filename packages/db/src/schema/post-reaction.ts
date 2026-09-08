import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { post } from "./post";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const postReaction = sqliteTable(
  "post_reaction",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("post_reaction_post_user_uidx").on(table.postId, table.userId),
  ],
);

export const postReactionRelations = relations(postReaction, ({ one }) => ({
  post: one(post, { fields: [postReaction.postId], references: [post.id] }),
  user: one(user, { fields: [postReaction.userId], references: [user.id] }),
}));
