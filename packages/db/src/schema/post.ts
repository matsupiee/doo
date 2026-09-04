import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt } from "./_shared";
import { assignment } from "./assignment";
import { mission } from "./mission";
import { user } from "./user";

export const postMediaType = ["photo", "video", "text"] as const;

/** The proof of a cleared mission — this is what the home feed is made of. */
export const post = sqliteTable(
  "post",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignment.id, { onDelete: "cascade" })
      .unique(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type", { enum: postMediaType }).default("text").notNull(),
    /** Null for text-only proof. */
    mediaUrl: text("media_url"),
    caption: text("caption"),
    createdAt: createdAt(),
  },
  (table) => [
    index("post_authorId_idx").on(table.authorId),
    index("post_createdAt_idx").on(table.createdAt),
  ],
);
