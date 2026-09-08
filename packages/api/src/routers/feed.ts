import { db } from "@doo/db";
import {
  mission,
  missionCompletion,
  missionCompletionParticipant,
  missionTag,
  post,
  postReaction,
  user,
} from "@doo/db/schema";
import { TRPCError } from "@trpc/server";
import { aliasedTable, and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const author = aliasedTable(user, "author");
const missionCreator = aliasedTable(user, "mission_creator");

export const feedRouter = router({
  /** 実際に使われているタグ。フィード上部のチップに並べる。 */
  tags: protectedProcedure.query(async () => {
    const rows = await db
      .select({
        title: missionTag.title,
        missionCount: sql<number>`count(distinct ${missionTag.missionId})`,
      })
      .from(missionTag)
      .groupBy(missionTag.title)
      .orderBy(desc(sql`count(distinct ${missionTag.missionId})`), asc(missionTag.title));

    return rows.map((row) => ({ ...row, missionCount: Number(row.missionCount) }));
  }),

  /** 全ユーザーの投稿を新しい順に。非公開の投稿は存在しない。 */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          /** 前のページの最後の投稿の作成時刻（ミリ秒）。 */
          cursor: z.number().int().optional(),
          /** どれか1つでも一致するタグを持つやりたいことの投稿だけ残す（OR）。 */
          tags: z.array(z.string().trim().min(1)).default([]),
        })
        .default({ limit: 20, tags: [] }),
    )
    .query(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      const tags = [...new Set(input.tags)];

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
          completionId: missionCompletion.id,
          completedAt: missionCompletion.completedAt,
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
        /** 達成報告なら1件、進捗報告なら無し。 */
        .leftJoin(missionCompletion, eq(missionCompletion.postId, post.id))
        .where(
          and(
            input.cursor ? lt(post.createdAt, new Date(input.cursor)) : undefined,
            /**
             * 1件の投稿が複数のタグに一致しても、in で1回だけ数えるので重複しない。
             * join で辿ると同じ投稿が複数行になる。
             */
            tags.length
              ? inArray(
                  mission.id,
                  db
                    .select({ id: missionTag.missionId })
                    .from(missionTag)
                    .where(inArray(missionTag.title, tags)),
                )
              : undefined,
          ),
        )
        .orderBy(desc(post.createdAt))
        .limit(input.limit);

      const missionIds = [...new Set(rows.map((row) => row.missionId))];
      const tagRows = missionIds.length
        ? await db
            .select({ missionId: missionTag.missionId, title: missionTag.title })
            .from(missionTag)
            .where(inArray(missionTag.missionId, missionIds))
            .orderBy(asc(missionTag.createdAt))
        : [];

      const byMission = new Map<string, string[]>();
      for (const row of tagRows) {
        const list = byMission.get(row.missionId);
        if (list) list.push(row.title);
        else byMission.set(row.missionId, [row.title]);
      }

      const completionIds = rows
        .map((row) => row.completionId)
        .filter((id): id is string => id !== null);
      const completionRows = completionIds.length
        ? await db
            .select({
              completionId: missionCompletionParticipant.completionId,
              userId: missionCompletionParticipant.userId,
              name: user.name,
            })
            .from(missionCompletionParticipant)
            .innerJoin(user, eq(user.id, missionCompletionParticipant.userId))
            .where(inArray(missionCompletionParticipant.completionId, completionIds))
            .orderBy(asc(missionCompletionParticipant.createdAt))
        : [];

      const byCompletion = new Map<string, { userId: string; name: string }[]>();
      for (const row of completionRows) {
        const list = byCompletion.get(row.completionId);
        const value = { userId: row.userId, name: row.name };
        if (list) list.push(value);
        else byCompletion.set(row.completionId, [value]);
      }

      const items = rows.map((row) => ({
        ...row,
        missionTags: byMission.get(row.missionId) ?? [],
        /** 達成の参加者。1人なら個人達成、複数人なら共同達成。進捗報告なら空。 */
        completionParticipants: row.completionId
          ? (byCompletion.get(row.completionId) ?? [])
          : [],
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
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "投稿が見つかりません" });

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
