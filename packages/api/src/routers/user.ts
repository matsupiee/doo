import { db } from "@doo/db";
import {
  mission,
  missionCompletion,
  missionCompletionParticipant,
  missionParticipant,
  missionTag,
  post,
  user,
} from "@doo/db/schema";
import { TRPCError } from "@trpc/server";
import { aliasedTable, and, asc, desc, eq, inArray, like, ne, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const completionParticipantUser = aliasedTable(user, "completion_participant_user");

/** その人が参加した達成を新しい順に。プロフィールの達成一覧に使う。 */
async function completionsOf(userId: string, limit: number) {
  const rows = await db
    .select({
      completionId: missionCompletion.id,
      completedAt: missionCompletion.completedAt,
      missionId: mission.id,
      missionTitle: mission.title,
      postId: post.id,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      caption: post.caption,
    })
    .from(missionCompletionParticipant)
    .innerJoin(
      missionCompletion,
      eq(missionCompletion.id, missionCompletionParticipant.completionId),
    )
    .innerJoin(mission, eq(mission.id, missionCompletion.missionId))
    .innerJoin(post, eq(post.id, missionCompletion.postId))
    .where(eq(missionCompletionParticipant.userId, userId))
    .orderBy(desc(missionCompletion.completedAt))
    .limit(limit);

  const participantRows = rows.length
    ? await db
        .select({
          completionId: missionCompletionParticipant.completionId,
          userId: missionCompletionParticipant.userId,
          name: completionParticipantUser.name,
        })
        .from(missionCompletionParticipant)
        .innerJoin(
          completionParticipantUser,
          eq(completionParticipantUser.id, missionCompletionParticipant.userId),
        )
        .where(
          inArray(
            missionCompletionParticipant.completionId,
            rows.map((row) => row.completionId),
          ),
        )
        .orderBy(asc(missionCompletionParticipant.createdAt))
    : [];

  const byCompletion = new Map<string, { userId: string; name: string }[]>();
  for (const row of participantRows) {
    const list = byCompletion.get(row.completionId);
    const value = { userId: row.userId, name: row.name };
    if (list) list.push(value);
    else byCompletion.set(row.completionId, [value]);
  }

  return rows.map((row) => ({
    ...row,
    participants: byCompletion.get(row.completionId) ?? [],
  }));
}

export const userRouter = router({
  /** サインインしているアカウントと、プロフィールのヘッダーに出す件数。 */
  me: protectedProcedure.query(async ({ ctx }) => {
    const [me] = await db
      .select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    if (!me) {
      throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
    }

    const [participating] = await db
      .select({ count: sql<number>`count(*)` })
      .from(missionParticipant)
      .where(eq(missionParticipant.userId, me.id));

    const [completed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(missionCompletionParticipant)
      .where(eq(missionCompletionParticipant.userId, me.id));

    return {
      id: me.id,
      name: me.name,
      email: me.email,
      image: me.image ?? null,
      participatingCount: Number(participating?.count ?? 0),
      completedCount: Number(completed?.count ?? 0),
    };
  }),

  updateName: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(40) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(user).set({ name: input.name }).where(eq(user.id, ctx.session.user.id));
      return { name: input.name };
    }),

  /** 共同達成に並べる人を選ぶために使う。 */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().max(40).default(""),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters = [ne(user.id, ctx.session.user.id)];
      if (input.query) {
        filters.push(like(user.name, `%${input.query}%`));
      }

      return db
        .select({ id: user.id, name: user.name, image: user.image })
        .from(user)
        .where(and(...filters))
        .orderBy(user.name)
        .limit(input.limit);
    }),

  /** 誰でも見えるプロフィール。登録したやりたいことと、達成した記録が並ぶ。 */
  profile: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const [target] = await db
        .select({ id: user.id, name: user.name, image: user.image })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ユーザーが見つかりません" });
      }

      const missions = await db
        .select({
          missionId: mission.id,
          title: mission.title,
          description: mission.description,
          createdAt: mission.createdAt,
        })
        .from(mission)
        .where(eq(mission.creatorId, target.id))
        .orderBy(desc(mission.createdAt))
        .limit(50);

      const tagRows = missions.length
        ? await db
            .select({ missionId: missionTag.missionId, title: missionTag.title })
            .from(missionTag)
            .where(
              inArray(
                missionTag.missionId,
                missions.map((row) => row.missionId),
              ),
            )
            .orderBy(asc(missionTag.createdAt))
        : [];

      const byMission = new Map<string, string[]>();
      for (const row of tagRows) {
        const list = byMission.get(row.missionId);
        if (list) list.push(row.title);
        else byMission.set(row.missionId, [row.title]);
      }

      return {
        user: target,
        missions: missions.map((row) => ({
          ...row,
          tags: byMission.get(row.missionId) ?? [],
        })),
        completions: await completionsOf(target.id, 50),
      };
    }),

  /** 自分の達成一覧。プロフィールの「達成したこと」に出す。 */
  myCompletions: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).default({ limit: 20 }))
    .query(async ({ ctx, input }) => completionsOf(ctx.session.user.id, input.limit)),
});
