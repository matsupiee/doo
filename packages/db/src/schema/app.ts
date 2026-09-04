import { relations, sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * A mission is the "do this thing" template: a title plus what counts as doing it.
 * It is created once and can be handed to any number of people through assignments.
 */
export const mission = sqliteTable(
  "mission",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    /** Free-form hint of what proof looks like, e.g. "動画で撮って". */
    proofHint: text("proof_hint"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(now)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("mission_creatorId_idx").on(table.creatorId)],
);

/**
 * A relay turns one mission into a chain: whoever clears it can hand the same
 * mission to the next people, up to `maxNominations` at each hop.
 */
export const relay = sqliteTable(
  "relay",
  {
    id: text("id").primaryKey(),
    missionId: text("mission_id")
      .notNull()
      .references(() => mission.id, { onDelete: "cascade" }),
    starterId: text("starter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** How many people a single participant may pass the baton to (1-10). */
    maxNominations: integer("max_nominations").default(1).notNull(),
    /** "open" while the chain can still grow, "closed" once every branch ended. */
    status: text("status", { enum: ["open", "closed"] })
      .default("open")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [index("relay_missionId_idx").on(table.missionId)],
);

/**
 * One person's copy of a mission. Relay hops are just assignments that point at
 * the assignment they came from, so a chain is a tree of these rows.
 */
export const assignment = sqliteTable(
  "assignment",
  {
    id: text("id").primaryKey(),
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
    /** How the assignee was picked, for the "指名 / ランダム" badge in the UI. */
    pickedBy: text("picked_by", { enum: ["self", "nominated", "random"] })
      .default("nominated")
      .notNull(),
    status: text("status", { enum: ["pending", "cleared", "declined"] })
      .default("pending")
      .notNull(),
    /** Set once the assignee decided whether to keep the chain going. */
    relayHandoff: text("relay_handoff", { enum: ["nominated", "random", "ended"] }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
    clearedAt: integer("cleared_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("assignment_assigneeId_status_idx").on(table.assigneeId, table.status),
    index("assignment_missionId_idx").on(table.missionId),
    index("assignment_relayId_idx").on(table.relayId),
    index("assignment_parentAssignmentId_idx").on(table.parentAssignmentId),
    uniqueIndex("assignment_mission_assignee_uidx").on(table.missionId, table.assigneeId),
  ],
);

/** The proof of a cleared mission — this is what the home feed is made of. */
export const post = sqliteTable(
  "post",
  {
    id: text("id").primaryKey(),
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
    mediaType: text("media_type", { enum: ["photo", "video", "text"] })
      .default("text")
      .notNull(),
    /** Null for text-only proof. */
    mediaUrl: text("media_url"),
    caption: text("caption"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [
    index("post_authorId_idx").on(table.authorId),
    index("post_createdAt_idx").on(table.createdAt),
  ],
);

export const postReaction = sqliteTable(
  "post_reaction",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [uniqueIndex("post_reaction_post_user_uidx").on(table.postId, table.userId)],
);

export const missionRelations = relations(mission, ({ one, many }) => ({
  creator: one(user, { fields: [mission.creatorId], references: [user.id] }),
  assignments: many(assignment),
  posts: many(post),
  relays: many(relay),
}));

export const relayRelations = relations(relay, ({ one, many }) => ({
  mission: one(mission, { fields: [relay.missionId], references: [mission.id] }),
  starter: one(user, { fields: [relay.starterId], references: [user.id] }),
  assignments: many(assignment),
}));

export const assignmentRelations = relations(assignment, ({ one, many }) => ({
  mission: one(mission, { fields: [assignment.missionId], references: [mission.id] }),
  assignee: one(user, { fields: [assignment.assigneeId], references: [user.id] }),
  relay: one(relay, { fields: [assignment.relayId], references: [relay.id] }),
  parent: one(assignment, {
    fields: [assignment.parentAssignmentId],
    references: [assignment.id],
    relationName: "relayChain",
  }),
  children: many(assignment, { relationName: "relayChain" }),
  post: one(post, { fields: [assignment.id], references: [post.assignmentId] }),
}));

export const postRelations = relations(post, ({ one, many }) => ({
  mission: one(mission, { fields: [post.missionId], references: [mission.id] }),
  author: one(user, { fields: [post.authorId], references: [user.id] }),
  assignment: one(assignment, { fields: [post.assignmentId], references: [assignment.id] }),
  reactions: many(postReaction),
}));

export const postReactionRelations = relations(postReaction, ({ one }) => ({
  post: one(post, { fields: [postReaction.postId], references: [post.id] }),
  user: one(user, { fields: [postReaction.userId], references: [user.id] }),
}));
