import { db } from "@doo/db";
import { assignment, mission, missionCategory, post, user } from "@doo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, like, ne, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const userRouter = router({
  /** The signed-in account plus the counters shown on the profile header. */
  me: protectedProcedure.query(async ({ ctx }) => {
    const [me] = await db
      .select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    if (!me) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const [counts] = await db
      .select({
        pending: sql<number>`sum(case when ${assignment.status} = 'pending' then 1 else 0 end)`,
        cleared: sql<number>`sum(case when ${assignment.status} = 'cleared' then 1 else 0 end)`,
      })
      .from(assignment)
      .where(eq(assignment.assigneeId, me.id));

    return {
      id: me.id,
      name: me.name,
      email: me.email,
      image: me.image ?? null,
      pendingCount: Number(counts?.pending ?? 0),
      clearedCount: Number(counts?.cleared ?? 0),
    };
  }),

  updateName: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(40) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(user).set({ name: input.name }).where(eq(user.id, ctx.session.user.id));
      return { name: input.name };
    }),

  /** Used by the mission composer to pick who receives the mission. */
  search: protectedProcedure
    .input(z.object({ query: z.string().trim().max(40).default(""), limit: z.number().min(1).max(50).default(20) }))
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

  /** Public profile: account name and what that person has cleared so far. */
  profile: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const [target] = await db
        .select({ id: user.id, name: user.name, image: user.image })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const posts = await db
        .select({
          id: post.id,
          missionId: mission.id,
          missionTitle: mission.title,
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
          createdAt: post.createdAt,
        })
        .from(post)
        .innerJoin(mission, eq(mission.id, post.missionId))
        .where(eq(post.authorId, target.id))
        .orderBy(desc(post.createdAt))
        .limit(50);

      const categoryRows = posts.length
        ? await db
            .select({ missionId: missionCategory.missionId, category: missionCategory.category })
            .from(missionCategory)
            .where(inArray(missionCategory.missionId, [...new Set(posts.map((p) => p.missionId))]))
            .orderBy(missionCategory.createdAt)
        : [];

      const byMission = new Map<string, string[]>();
      for (const row of categoryRows) {
        const list = byMission.get(row.missionId);
        if (list) list.push(row.category);
        else byMission.set(row.missionId, [row.category]);
      }

      return {
        user: target,
        posts: posts.map((row) => ({
          ...row,
          missionCategories: byMission.get(row.missionId) ?? [],
        })),
      };
    }),
});
