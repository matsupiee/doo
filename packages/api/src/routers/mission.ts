import { db } from "@doo/db";
import {
  mission,
  missionCompletion,
  missionCompletionParticipant,
  missionParticipant,
  missionTag,
  post,
  postMediaType,
  user,
} from "@doo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

/** タグは自由入力。旧カテゴリの固定 enum は廃止した。 */
export const MAX_MISSION_TAGS = 10;
/** 1件の達成に並べられる人数。自分を含む。 */
export const MAX_COMPLETION_PARTICIPANTS = 20;

const tagSchema = z.string().trim().min(1).max(20);

const mediaSchema = z.object({
  mediaType: z.enum(postMediaType).default("text"),
  mediaUrl: z.url().optional(),
  caption: z.string().trim().max(500).optional(),
});

type MediaInput = z.infer<typeof mediaSchema>;

/** 写真・動画の投稿には URL が要る。テキストだけの投稿は URL を持たない。 */
function normalizeMedia(input: MediaInput) {
  if (input.mediaType !== "text" && !input.mediaUrl) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "写真・動画の投稿には URL が必要です",
    });
  }
  return {
    mediaType: input.mediaType,
    mediaUrl: input.mediaType === "text" ? null : (input.mediaUrl ?? null),
    caption: input.caption ?? null,
  };
}

/** タグをミッション ID ごとにまとめて引く。一覧のクエリを1往復で済ませるため。 */
async function tagsByMission(missionIds: string[]) {
  const map = new Map<string, string[]>();
  if (!missionIds.length) return map;

  const rows = await db
    .select({ missionId: missionTag.missionId, title: missionTag.title })
    .from(missionTag)
    .where(inArray(missionTag.missionId, [...new Set(missionIds)]))
    .orderBy(asc(missionTag.createdAt));

  for (const row of rows) {
    const list = map.get(row.missionId);
    if (list) list.push(row.title);
    else map.set(row.missionId, [row.title]);
  }
  return map;
}

async function assertUsersExist(userIds: string[]) {
  if (!userIds.length) return;
  const found = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.id, userIds));
  if (found.length !== userIds.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "存在しないユーザーが含まれています" });
  }
}

async function findMission(missionId: string) {
  const [row] = await db
    .select({ id: mission.id, creatorId: mission.creatorId })
    .from(mission)
    .where(eq(mission.id, missionId))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "やりたいことが見つかりません" });
  }
  return row;
}

async function isParticipant(missionId: string, userId: string) {
  const [row] = await db
    .select({ userId: missionParticipant.userId })
    .from(missionParticipant)
    .where(
      and(eq(missionParticipant.missionId, missionId), eq(missionParticipant.userId, userId)),
    )
    .limit(1);
  return Boolean(row);
}

export const missionRouter = router({
  /**
   * やりたいことを登録する。作成者は同じトランザクションで参加者にもなる。
   * 参加者0人のやりたいことは存在しない。
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(80),
        description: z.string().trim().max(500).optional(),
        tags: z.array(tagSchema).max(MAX_MISSION_TAGS).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      const tags = [...new Set(input.tags)];

      const missionId = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(mission)
          .values({
            title: input.title,
            description: input.description ?? null,
            creatorId: meId,
          })
          .returning({ id: mission.id });
        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "やりたいことを登録できませんでした",
          });
        }

        await tx.insert(missionParticipant).values({ missionId: created.id, userId: meId });

        if (tags.length) {
          await tx
            .insert(missionTag)
            .values(tags.map((title) => ({ missionId: created.id, title })));
        }

        return created.id;
      });

      return { missionId, tags };
    }),

  /** 自分が登録したやりたいこと。プロフィールの一覧に使う。 */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        missionId: mission.id,
        title: mission.title,
        description: mission.description,
        createdAt: mission.createdAt,
        /**
         * `db.$count` を使う。join の無いクエリだと sql`` の中のカラムが
         * テーブル名なしで出るので、副問い合わせ側の同名カラムに解決されてしまう。
         */
        participantCount: db.$count(
          missionParticipant,
          eq(missionParticipant.missionId, mission.id),
        ),
        completionCount: db.$count(
          missionCompletion,
          eq(missionCompletion.missionId, mission.id),
        ),
      })
      .from(mission)
      .where(eq(mission.creatorId, ctx.session.user.id))
      .orderBy(desc(mission.createdAt));

    const tags = await tagsByMission(rows.map((row) => row.missionId));
    return rows.map((row) => ({
      ...row,
      participantCount: Number(row.participantCount),
      completionCount: Number(row.completionCount),
      tags: tags.get(row.missionId) ?? [],
    }));
  }),

  /** 参加しているやりたいこと。自分が作ったものも参加者なので並ぶ。 */
  participating: protectedProcedure.query(async ({ ctx }) => {
    const meId = ctx.session.user.id;

    const rows = await db
      .select({
        missionId: mission.id,
        title: mission.title,
        description: mission.description,
        creatorId: mission.creatorId,
        creatorName: user.name,
        joinedAt: missionParticipant.createdAt,
        participantCount: db.$count(
          missionParticipant,
          eq(missionParticipant.missionId, mission.id),
        ),
        myCompletionCount: db.$count(
          missionCompletionParticipant,
          and(
            eq(missionCompletionParticipant.missionId, mission.id),
            eq(missionCompletionParticipant.userId, meId),
          ),
        ),
      })
      .from(missionParticipant)
      .innerJoin(mission, eq(mission.id, missionParticipant.missionId))
      .innerJoin(user, eq(user.id, mission.creatorId))
      .where(eq(missionParticipant.userId, meId))
      .orderBy(desc(missionParticipant.createdAt));

    const tags = await tagsByMission(rows.map((row) => row.missionId));
    return rows.map((row) => ({
      ...row,
      isCreator: row.creatorId === meId,
      participantCount: Number(row.participantCount),
      myCompletionCount: Number(row.myCompletionCount),
      tags: tags.get(row.missionId) ?? [],
    }));
  }),

  /**
   * やりたいことの詳細。サインインしていれば誰のものでも見える。
   * 非公開のやりたいことは存在しない。
   */
  get: protectedProcedure
    .input(z.object({ missionId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;

      const [row] = await db
        .select({
          missionId: mission.id,
          title: mission.title,
          description: mission.description,
          createdAt: mission.createdAt,
          creatorId: mission.creatorId,
          creatorName: user.name,
          creatorImage: user.image,
        })
        .from(mission)
        .innerJoin(user, eq(user.id, mission.creatorId))
        .where(eq(mission.id, input.missionId))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "やりたいことが見つかりません" });
      }

      const [tags, participants, completions] = await Promise.all([
        db
          .select({ title: missionTag.title })
          .from(missionTag)
          .where(eq(missionTag.missionId, row.missionId))
          .orderBy(asc(missionTag.createdAt)),
        db
          .select({
            userId: missionParticipant.userId,
            name: user.name,
            image: user.image,
            joinedAt: missionParticipant.createdAt,
          })
          .from(missionParticipant)
          .innerJoin(user, eq(user.id, missionParticipant.userId))
          .where(eq(missionParticipant.missionId, row.missionId))
          .orderBy(asc(missionParticipant.createdAt)),
        db
          .select({
            completionId: missionCompletion.id,
            completedAt: missionCompletion.completedAt,
            postId: post.id,
            mediaType: post.mediaType,
            mediaUrl: post.mediaUrl,
            caption: post.caption,
          })
          .from(missionCompletion)
          .innerJoin(post, eq(post.id, missionCompletion.postId))
          .where(eq(missionCompletion.missionId, row.missionId))
          .orderBy(desc(missionCompletion.completedAt)),
      ]);

      const completionParticipants = completions.length
        ? await db
            .select({
              completionId: missionCompletionParticipant.completionId,
              userId: missionCompletionParticipant.userId,
              name: user.name,
            })
            .from(missionCompletionParticipant)
            .innerJoin(user, eq(user.id, missionCompletionParticipant.userId))
            .where(
              inArray(
                missionCompletionParticipant.completionId,
                completions.map((completion) => completion.completionId),
              ),
            )
            .orderBy(asc(missionCompletionParticipant.createdAt))
        : [];

      const byCompletion = new Map<string, { userId: string; name: string }[]>();
      for (const entry of completionParticipants) {
        const list = byCompletion.get(entry.completionId);
        const value = { userId: entry.userId, name: entry.name };
        if (list) list.push(value);
        else byCompletion.set(entry.completionId, [value]);
      }

      return {
        ...row,
        tags: tags.map((tag) => tag.title),
        participants,
        completions: completions.map((completion) => ({
          ...completion,
          participants: byCompletion.get(completion.completionId) ?? [],
        })),
        isCreator: row.creatorId === meId,
        isParticipant: participants.some((participant) => participant.userId === meId),
        myCompletionCount: completions.filter((completion) =>
          (byCompletion.get(completion.completionId) ?? []).some(
            (participant) => participant.userId === meId,
          ),
        ).length,
      };
    }),

  /**
   * やりたいことに参加する。承認も招待も無い。
   * 何度呼んでも参加者は増えない（複合主キーの1行なので）。
   */
  join: protectedProcedure
    .input(z.object({ missionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      const target = await findMission(input.missionId);

      if (await isParticipant(target.id, meId)) {
        return { missionId: target.id, joined: false };
      }

      await db.insert(missionParticipant).values({ missionId: target.id, userId: meId });
      return { missionId: target.id, joined: true };
    }),

  /**
   * やりたいことから抜ける。参加行を消すと自分の達成参加も cascade で消えるので、
   * 自分の達成が1件でもあれば拒否する。他の人の達成は判定に関係しない。
   * 作成者は抜けられない。やめるときはやりたいことごと消す。
   */
  leave: protectedProcedure
    .input(z.object({ missionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      const target = await findMission(input.missionId);

      if (!(await isParticipant(target.id, meId))) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "このやりたいことに参加していません",
        });
      }

      if (target.creatorId === meId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "作成者は抜けられません。やめるときはやりたいことを削除してください",
        });
      }

      const [mine] = await db
        .select({ completionId: missionCompletionParticipant.completionId })
        .from(missionCompletionParticipant)
        .where(
          and(
            eq(missionCompletionParticipant.missionId, target.id),
            eq(missionCompletionParticipant.userId, meId),
          ),
        )
        .limit(1);

      if (mine) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "達成を記録しているので抜けられません",
        });
      }

      await db
        .delete(missionParticipant)
        .where(
          and(
            eq(missionParticipant.missionId, target.id),
            eq(missionParticipant.userId, meId),
          ),
        );

      return { missionId: target.id, left: true };
    }),

  /** やりたいことを消す。作成者だけができる。達成も投稿も cascade で消える。 */
  remove: protectedProcedure
    .input(z.object({ missionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const target = await findMission(input.missionId);
      if (target.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "作成者だけが削除できます" });
      }

      await db.delete(mission).where(eq(mission.id, target.id));
      return { missionId: target.id };
    }),

  /**
   * 達成を記録して投稿する。投稿のない達成は作らない。
   * 達成参加者が1人なら個人達成、複数人なら共同達成。テーブルもフラグも分けない。
   * まだ参加していない人を含めたときは、同じトランザクションで参加者にしてから並べる。
   */
  complete: protectedProcedure
    .input(
      mediaSchema.extend({
        missionId: z.string().min(1),
        /** 一緒に達成した人。自分は指定しなくても必ず含まれる。 */
        participantIds: z
          .array(z.string().min(1))
          .max(MAX_COMPLETION_PARTICIPANTS)
          .default([]),
        /** 記録した時刻とは別に指定できる。未指定なら記録時刻。 */
        completedAt: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      const target = await findMission(input.missionId);
      const media = normalizeMedia(input);

      if (!(await isParticipant(target.id, meId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "参加しているやりたいことだけ達成を記録できます",
        });
      }

      const others = [...new Set(input.participantIds)].filter((id) => id !== meId);
      await assertUsersExist(others);
      const participantIds = [meId, ...others];

      const existing = await db
        .select({ userId: missionParticipant.userId })
        .from(missionParticipant)
        .where(eq(missionParticipant.missionId, target.id));
      const joined = new Set(existing.map((row) => row.userId));
      const newcomers = others.filter((id) => !joined.has(id));

      return db.transaction(async (tx) => {
        if (newcomers.length) {
          await tx
            .insert(missionParticipant)
            .values(newcomers.map((userId) => ({ missionId: target.id, userId })));
        }

        const [createdPost] = await tx
          .insert(post)
          .values({ missionId: target.id, authorId: meId, ...media })
          .returning({ id: post.id });
        if (!createdPost) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "投稿を作成できませんでした",
          });
        }

        const [completion] = await tx
          .insert(missionCompletion)
          .values({
            missionId: target.id,
            postId: createdPost.id,
            completedAt: input.completedAt ? new Date(input.completedAt) : new Date(),
          })
          .returning({ id: missionCompletion.id });
        if (!completion) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "達成を記録できませんでした",
          });
        }

        await tx.insert(missionCompletionParticipant).values(
          participantIds.map((userId) => ({
            completionId: completion.id,
            missionId: target.id,
            userId,
          })),
        );

        return {
          missionId: target.id,
          completionId: completion.id,
          postId: createdPost.id,
          participantIds,
          /** 参加していなかったので、この達成と同時に参加者になった人。 */
          addedParticipantIds: newcomers,
          isShared: participantIds.length > 1,
        };
      });
    }),

  /** 達成せずに進捗を投稿する。達成はぶら下がらないので達成一覧には並ばない。 */
  postProgress: protectedProcedure
    .input(mediaSchema.extend({ missionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      const target = await findMission(input.missionId);
      const media = normalizeMedia(input);

      if (!(await isParticipant(target.id, meId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "参加しているやりたいことだけ投稿できます",
        });
      }

      const [createdPost] = await db
        .insert(post)
        .values({ missionId: target.id, authorId: meId, ...media })
        .returning({ id: post.id });
      if (!createdPost) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "投稿を作成できませんでした",
        });
      }

      return { missionId: target.id, postId: createdPost.id };
    }),
});
