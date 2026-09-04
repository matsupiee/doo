import { createId } from "@paralleldrive/cuid2";
import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { createdAt } from "./_shared";
import { mission } from "./mission";
import { relay } from "./relay";
import { user } from "./user";

/** How the assignee was picked, for the "指名 / ランダム" badge in the UI. */
export const assignmentPickedBy = ["self", "nominated", "random"] as const;
export const assignmentStatus = ["pending", "cleared", "declined"] as const;
/** What the assignee decided to do with the baton once they cleared it. */
export const assignmentRelayHandoff = ["nominated", "random", "ended"] as const;

/**
 * One person's copy of a mission. Relay hops are just assignments that point at
 * the assignment they came from, so a chain is a tree of these rows.
 */
export const assignment = sqliteTable(
  "assignment",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Null when someone picked the mission up for themselves. */
    assignerId: text("assigner_id").references(() => user.id, { onDelete: "set null" }),
    relayId: text("relay_id").references(() => relay.id, { onDelete: "cascade" }),
    parentAssignmentId: text("parent_assignment_id").references(
      (): AnySQLiteColumn => assignment.id,
      { onDelete: "set null" },
    ),
    /** 0 for the person who started the relay, +1 per hop. */
    depth: integer("depth").default(0).notNull(),
    pickedBy: text("picked_by", { enum: assignmentPickedBy }).default("nominated").notNull(),
    status: text("status", { enum: assignmentStatus }).default("pending").notNull(),
    /** Set once the assignee decided whether to keep the chain going. */
    relayHandoff: text("relay_handoff", { enum: assignmentRelayHandoff }),
    clearedAt: integer("cleared_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (table) => [
    index("assignment_assigneeId_status_idx").on(table.assigneeId, table.status),
    index("assignment_missionId_idx").on(table.missionId),
    index("assignment_relayId_idx").on(table.relayId),
    index("assignment_parentAssignmentId_idx").on(table.parentAssignmentId),
    uniqueIndex("assignment_mission_assignee_uidx").on(table.missionId, table.assigneeId),
  ],
);
