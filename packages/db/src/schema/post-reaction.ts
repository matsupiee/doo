import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { createdAt } from "./_shared";
import { post } from "./post";
import { user } from "./user";

export const postReaction = sqliteTable(
  "post_reaction",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("post_reaction_post_user_uidx").on(table.postId, table.userId)],
);
