import { db } from "@doo/db";
import {
  assignment,
  mission,
  missionCategory,
  missionCategoryValues,
  post,
  postReaction,
  relay,
  user,
} from "@doo/db/schema";
import { TRPCError } from "@trpc/server";
import { aliasedTable, and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const author = aliasedTable(user, "author");
const missionCreator = aliasedTable(user, "mission_creator");

export const feedRouter = router({
  /** "誰か面白い達成してないかな？" — every proof post, newest first. */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          /** Timestamp (ms) of the last item of the previous page. */
          cursor: z.number().int().optional(),
          /** Show only posts whose mission carries one of these categories. */
          categories: z.array(z.enum(missionCategoryValues)).default([]),
        })
        .default({ limit: 20, categories: [] }),
    )
    .query(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;

      const rows = await db
        .select({
          id: post.id,
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
          createdAt: post.createdAt,
          authorId: author.id,
          authorName: author.name,
          authorImage: author.image,
          missionId: mission.id,
          missionTitle: mission.title,
          missionDescription: mission.description,
          missionCreatorName: missionCreator.name,
          relayId: assignment.relayId,
          relayDepth: assignment.depth,
          relayHandoff: assignment.relayHandoff,
          pickedBy: assignment.pickedBy,
          reactionCount: sql<number>`(
            select count(*) from ${postReaction} where ${postReaction.postId} = ${post.id}
          )`,
          reactedByMe: sql<number>`(
            select count(*) from ${postReaction}
            where ${postReaction.postId} = ${post.id} and ${postReaction.userId} = ${meId}
          )`,
        })
        .from(post)
        .innerJoin(author, eq(author.id, post.authorId))
        .innerJoin(mission, eq(mission.id, post.missionId))
        .innerJoin(missionCreator, eq(missionCreator.id, mission.creatorId))
        .innerJoin(assignment, eq(assignment.id, post.assignmentId))
        .where(
          and(
            input.cursor ? lt(post.createdAt, new Date(input.cursor)) : undefined,
            input.categories.length
              ? inArray(
                  mission.id,
                  db
                    .select({ id: missionCategory.missionId })
                    .from(missionCategory)
                    .where(inArray(missionCategory.category, input.categories)),
                )
              : undefined,
          ),
        )
        .orderBy(desc(post.createdAt))
        .limit(input.limit);

      const categoryRows = rows.length
        ? await db
            .select({ missionId: missionCategory.missionId, category: missionCategory.category })
            .from(missionCategory)
            .where(inArray(missionCategory.missionId, [...new Set(rows.map((r) => r.missionId))]))
            .orderBy(missionCategory.createdAt)
        : [];

      const byMission = new Map<string, string[]>();
      for (const row of categoryRows) {
        const list = byMission.get(row.missionId);
        if (list) list.push(row.category);
        else byMission.set(row.missionId, [row.category]);
      }

      const items = rows.map((row) => ({
        ...row,
        missionCategories: (byMission.get(row.missionId) ?? []) as (typeof missionCategoryValues)[number][],
        reactionCount: Number(row.reactionCount),
        reactedByMe: Number(row.reactedByMe) > 0,
      }));

      const last = items.at(-1);

      return {
        items,
        nextCursor: items.length === input.limit && last ? last.createdAt.getTime() : null,
      };
    }),

  toggleReaction: protectedProcedure
    .input(z.object({ postId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;

      const [target] = await db
        .select({ id: post.id })
        .from(post)
        .where(eq(post.id, input.postId))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

      const [existing] = await db
        .select({ id: postReaction.id })
        .from(postReaction)
        .where(and(eq(postReaction.postId, input.postId), eq(postReaction.userId, meId)))
        .limit(1);

      if (existing) {
        await db.delete(postReaction).where(eq(postReaction.id, existing.id));
        return { reacted: false };
      }

      await db.insert(postReaction).values({ postId: input.postId, userId: meId });
      return { reacted: true };
    }),
});

export const relayRouter = router({
  /** The whole chain behind one relay, for the relay detail screen. */
  get: protectedProcedure
    .input(z.object({ relayId: z.string().min(1) }))
    .query(async ({ input }) => {
      const [relayRow] = await db
        .select({
          id: relay.id,
          status: relay.status,
          maxNominations: relay.maxNominations,
          createdAt: relay.createdAt,
          missionId: mission.id,
          missionTitle: mission.title,
          missionDescription: mission.description,
          starterName: user.name,
        })
        .from(relay)
        .innerJoin(mission, eq(mission.id, relay.missionId))
        .innerJoin(user, eq(user.id, relay.starterId))
        .where(eq(relay.id, input.relayId))
        .limit(1);

      if (!relayRow) throw new TRPCError({ code: "NOT_FOUND", message: "Relay not found" });

      const categoryRows = await db
        .select({ category: missionCategory.category })
        .from(missionCategory)
        .where(eq(missionCategory.missionId, relayRow.missionId))
        .orderBy(missionCategory.createdAt);

      const nodes = await db
        .select({
          assignmentId: assignment.id,
          parentAssignmentId: assignment.parentAssignmentId,
          depth: assignment.depth,
          status: assignment.status,
          pickedBy: assignment.pickedBy,
          relayHandoff: assignment.relayHandoff,
          clearedAt: assignment.clearedAt,
          assigneeId: user.id,
          assigneeName: user.name,
          postId: post.id,
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
        })
        .from(assignment)
        .innerJoin(user, eq(user.id, assignment.assigneeId))
        .leftJoin(post, eq(post.assignmentId, assignment.id))
        .where(eq(assignment.relayId, input.relayId))
        .orderBy(assignment.depth, assignment.createdAt);

      return {
        relay: { ...relayRow, categories: categoryRows.map((row) => row.category) },
        nodes,
      };
    }),
});
