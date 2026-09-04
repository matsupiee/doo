import { createId } from "@paralleldrive/cuid2";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { createdAt } from "./_shared";
import { mission } from "./mission";

/**
 * The categories a mission can be filed under. Fixed on purpose so the DB
 * rejects anything the app does not have a label for.
 */
export const missionCategoryValues = [
  "cooking",
  "sports",
  "outing",
  "learning",
  "creative",
  "fun",
  "life",
  "other",
] as const;

export type MissionCategory = (typeof missionCategoryValues)[number];

/**
 * One mission can sit in several categories at once ("料理" かつ "ネタ" など),
 * so the link lives in its own table rather than a column on `mission`.
 */
export const missionCategory = sqliteTable(
  "mission_category",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    category: text("category", { enum: missionCategoryValues }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("mission_category_missionId_idx").on(table.missionId),
    index("mission_category_category_idx").on(table.category),
    uniqueIndex("mission_category_mission_category_uidx").on(table.missionId, table.category),
  ],
);
