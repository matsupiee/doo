import { createId } from "@paralleldrive/cuid2";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { assignment } from "./assignment";

/** "open" while the chain can still grow, "closed" once every branch ended. */
export const relayStatus = ["open", "closed"] as const;

/**
 * A relay turns one mission into a chain: whoever clears it can hand the same
 * mission to the next people, up to `maxNominations` at each hop.
 */
export const relay = sqliteTable(
  "relay",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    starterId: text("starter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** How many people a single participant may pass the baton to (1-10). */
    maxNominations: integer("max_nominations").default(1).notNull(),
    status: text("status", { enum: relayStatus }).default("open").notNull(),
  },
  (table) => [index("relay_missionId_idx").on(table.missionId)],
);

export const relayRelations = relations(relay, ({ one, many }) => ({
  mission: one(mission, {
    fields: [relay.missionId],
    references: [mission.id],
  }),
  starter: one(user, { fields: [relay.starterId], references: [user.id] }),
  assignments: many(assignment),
}));
