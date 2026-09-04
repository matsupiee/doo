import { relations } from "drizzle-orm";

import { account } from "./account";
import { assignment } from "./assignment";
import { mission } from "./mission";
import { missionCategory } from "./mission-category";
import { post } from "./post";
import { postReaction } from "./post-reaction";
import { relay } from "./relay";
import { session } from "./session";
import { user } from "./user";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const missionRelations = relations(mission, ({ one, many }) => ({
  creator: one(user, { fields: [mission.creatorId], references: [user.id] }),
  assignments: many(assignment),
  posts: many(post),
  relays: many(relay),
  categories: many(missionCategory),
}));

export const missionCategoryRelations = relations(missionCategory, ({ one }) => ({
  mission: one(mission, { fields: [missionCategory.missionId], references: [mission.id] }),
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
  assignment: one(assignment, {
    fields: [post.assignmentId],
    references: [assignment.id],
  }),
  reactions: many(postReaction),
}));

export const postReactionRelations = relations(postReaction, ({ one }) => ({
  post: one(post, { fields: [postReaction.postId], references: [post.id] }),
  user: one(user, { fields: [postReaction.userId], references: [user.id] }),
}));
