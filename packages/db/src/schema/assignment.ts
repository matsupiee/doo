import { createId } from "@paralleldrive/cuid2";
import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { createdAt, updatedAt } from "./_shared";
import { mission } from "./mission";
import { relay } from "./relay";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { post } from "./post";

/** How the assignee was picked, for the "指名 / ランダム / 参加" badge in the UI. */
export const assignmentPickedBy = [
  "self", // 自分
  "nominated", // 指名
  "random", // ランダム
  "joined", // 参加
] as const;

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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Null when someone picked the mission up for themselves. */
    assignerId: text("assigner_id").references(() => user.id, {
      onDelete: "set null",
    }),
    relayId: text("relay_id").references(() => relay.id, {
      onDelete: "cascade",
    }),
    parentAssignmentId: text("parent_assignment_id").references(
      (): AnySQLiteColumn => assignment.id,
      { onDelete: "set null" },
    ),
    /** 0 for the person who started the relay, +1 per hop. */
    depth: integer("depth").default(0).notNull(),
    pickedBy: text("picked_by", { enum: assignmentPickedBy })
      .default("nominated")
      .notNull(),
    /**
     * The "これ一緒にやらない？" note attached when someone invites another
     * participant. Null when the assignee took the mission on themselves.
     */
    inviteMessage: text("invite_message"),
    status: text("status", { enum: assignmentStatus })
      .default("pending")
      .notNull(),
    /** Set once the assignee decided whether to keep the chain going. */
    relayHandoff: text("relay_handoff", { enum: assignmentRelayHandoff }),
    clearedAt: integer("cleared_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("assignment_assigneeId_status_idx").on(
      table.assigneeId,
      table.status,
    ),
    index("assignment_missionId_idx").on(table.missionId),
    index("assignment_relayId_idx").on(table.relayId),
    index("assignment_parentAssignmentId_idx").on(table.parentAssignmentId),
    uniqueIndex("assignment_mission_assignee_uidx").on(
      table.missionId,
      table.assigneeId,
    ),
  ],
);

export const assignmentRelations = relations(assignment, ({ one, many }) => ({
  mission: one(mission, {
    fields: [assignment.missionId],
    references: [mission.id],
  }),
  assignee: one(user, {
    fields: [assignment.assigneeId],
    references: [user.id],
  }),
  relay: one(relay, { fields: [assignment.relayId], references: [relay.id] }),
  parent: one(assignment, {
    fields: [assignment.parentAssignmentId],
    references: [assignment.id],
    relationName: "relayChain",
  }),
  children: many(assignment, { relationName: "relayChain" }),
  post: one(post, { fields: [assignment.id], references: [post.assignmentId] }),
}));
