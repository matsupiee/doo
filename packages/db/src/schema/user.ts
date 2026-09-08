import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { relations } from "drizzle-orm";
import { session } from "./session";
import { account } from "./account";

export const user = sqliteTable("user", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));
