import { db } from "@doo/db";
import { assignment, mission, post, relay, user } from "@doo/db/schema";
import { TRPCError } from "@trpc/server";
import { aliasedTable, and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const MAX_RELAY_NOMINATIONS = 10;

const assigner = aliasedTable(user, "assigner");

const handoffSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("nominated"), assigneeIds: z.array(z.string().min(1)).min(1) }),
  z.object({ mode: z.literal("random") }),
  z.object({ mode: z.literal("ended") }),
]);

/** Rows already in this relay, so nobody gets the same baton twice. */
async function relayParticipantIds(relayId: string) {
  const rows = await db
    .select({ assigneeId: assignment.assigneeId })
    .from(assignment)
    .where(eq(assignment.relayId, relayId));
  return rows.map((row) => row.assigneeId);
}

async function pickRandomUser(excludeIds: string[]) {
  const [picked] = await db
    .select({ id: user.id })
    .from(user)
    .where(excludeIds.length ? notInArray(user.id, excludeIds) : undefined)
    .orderBy(sql`random()`)
    .limit(1);
  return picked?.id ?? null;
}

async function assertUsersExist(userIds: string[]) {
  if (!userIds.length) return;
  const found = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.id, userIds));
  if (found.length !== userIds.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown user in the recipient list" });
  }
}

export const missionRouter = router({
  /**
   * Create a mission and hand it out. `assignToSelf` keeps it as a personal
   * challenge; `relay` turns the whole thing into a chain the receivers can pass on.
   */
  create: protectedProcedure
    .input(
      z
        .object({
          title: z.string().trim().min(1).max(80),
          description: z.string().trim().max(500).optional(),
          proofHint: z.string().trim().max(200).optional(),
          assigneeIds: z.array(z.string().min(1)).max(MAX_RELAY_NOMINATIONS).default([]),
          assignToSelf: z.boolean().default(false),
          relay: z
            .object({
              enabled: z.literal(true),
              maxNominations: z.number().int().min(1).max(MAX_RELAY_NOMINATIONS).default(1),
            })
            .optional(),
        })
        .refine((value) => value.assignToSelf || value.assigneeIds.length > 0, {
          message: "Pick at least one person, or take the mission yourself",
          path: ["assigneeIds"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;
      const recipients = [...new Set(input.assigneeIds.filter((id) => id !== meId))];
      await assertUsersExist(recipients);

      const missionId = crypto.randomUUID();
      await db.insert(mission).values({
        id: missionId,
        title: input.title,
        description: input.description ?? null,
        proofHint: input.proofHint ?? null,
        creatorId: meId,
      });

      let relayId: string | null = null;
      if (input.relay) {
        relayId = crypto.randomUUID();
        await db.insert(relay).values({
          id: relayId,
          missionId,
          starterId: meId,
          maxNominations: input.relay.maxNominations,
        });
      }

      const rows = [
        ...(input.assignToSelf
          ? [
              {
                id: crypto.randomUUID(),
                missionId,
                assigneeId: meId,
                assignerId: null,
                relayId,
                parentAssignmentId: null,
                depth: 0,
                pickedBy: "self" as const,
              },
            ]
          : []),
        ...recipients.map((assigneeId) => ({
          id: crypto.randomUUID(),
          missionId,
          assigneeId,
          assignerId: meId,
          relayId,
          parentAssignmentId: null,
          depth: 0,
          pickedBy: "nominated" as const,
        })),
      ];

      await db.insert(assignment).values(rows);

      return { missionId, relayId, assignmentCount: rows.length };
    }),

  /** "自分に面白い依頼が来てないかな？" — the missions waiting on me. */
  inbox: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        assignmentId: assignment.id,
        status: assignment.status,
        pickedBy: assignment.pickedBy,
        depth: assignment.depth,
        createdAt: assignment.createdAt,
        relayId: assignment.relayId,
        relayMaxNominations: relay.maxNominations,
        missionId: mission.id,
        title: mission.title,
        description: mission.description,
        proofHint: mission.proofHint,
        assignerName: assigner.name,
      })
      .from(assignment)
      .innerJoin(mission, eq(mission.id, assignment.missionId))
      .leftJoin(assigner, eq(assigner.id, assignment.assignerId))
      .leftJoin(relay, eq(relay.id, assignment.relayId))
      .where(and(eq(assignment.assigneeId, ctx.session.user.id), eq(assignment.status, "pending")))
      .orderBy(desc(assignment.createdAt));
  }),

  /** Missions I handed out, with how far each one got. */
  sent: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        missionId: mission.id,
        title: mission.title,
        createdAt: mission.createdAt,
        relayId: relay.id,
        total: sql<number>`count(${assignment.id})`,
        cleared: sql<number>`sum(case when ${assignment.status} = 'cleared' then 1 else 0 end)`,
      })
      .from(mission)
      .leftJoin(assignment, eq(assignment.missionId, mission.id))
      .leftJoin(relay, eq(relay.missionId, mission.id))
      .where(eq(mission.creatorId, ctx.session.user.id))
      .groupBy(mission.id, relay.id)
      .orderBy(desc(mission.createdAt));
  }),

  decline: protectedProcedure
    .input(z.object({ assignmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .select()
        .from(assignment)
        .where(
          and(eq(assignment.id, input.assignmentId), eq(assignment.assigneeId, ctx.session.user.id)),
        )
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found" });
      if (row.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This mission is already closed" });
      }

      await db
        .update(assignment)
        .set({ status: "declined", relayHandoff: "ended" })
        .where(eq(assignment.id, row.id));

      return { assignmentId: row.id };
    }),

  /**
   * Clear a mission: store the proof post and, when the mission is a relay,
   * hand the baton on (nominate up to `maxNominations`, roll a random person,
   * or stop the chain here).
   */
  clear: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string().min(1),
        mediaType: z.enum(["photo", "video", "text"]).default("text"),
        mediaUrl: z.url().optional(),
        caption: z.string().trim().max(500).optional(),
        handoff: handoffSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meId = ctx.session.user.id;

      const [row] = await db
        .select()
        .from(assignment)
        .where(and(eq(assignment.id, input.assignmentId), eq(assignment.assigneeId, meId)))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found" });
      if (row.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This mission is already closed" });
      }
      if (input.mediaType !== "text" && !input.mediaUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Photo and video proof needs a URL" });
      }

      const postId = crypto.randomUUID();
      await db.insert(post).values({
        id: postId,
        assignmentId: row.id,
        missionId: row.missionId,
        authorId: meId,
        mediaType: input.mediaType,
        mediaUrl: input.mediaUrl ?? null,
        caption: input.caption ?? null,
      });

      const handoff = row.relayId ? (input.handoff ?? { mode: "ended" as const }) : null;
      const nextAssignees: { id: string; pickedBy: "nominated" | "random" }[] = [];

      if (row.relayId && handoff && handoff.mode !== "ended") {
        const [relayRow] = await db
          .select()
          .from(relay)
          .where(eq(relay.id, row.relayId))
          .limit(1);

        if (!relayRow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Relay not found" });
        }

        const taken = await relayParticipantIds(relayRow.id);

        if (handoff.mode === "nominated") {
          const candidates = [...new Set(handoff.assigneeIds)].filter((id) => !taken.includes(id));
          if (candidates.length > relayRow.maxNominations) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `This relay allows at most ${relayRow.maxNominations} nominations per hop`,
            });
          }
          await assertUsersExist(candidates);
          for (const id of candidates) {
            nextAssignees.push({ id, pickedBy: "nominated" });
          }
        } else {
          const picked = await pickRandomUser(taken);
          if (!picked) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Nobody left to pass the baton to",
            });
          }
          nextAssignees.push({ id: picked, pickedBy: "random" });
        }
      }

      await db
        .update(assignment)
        .set({
          status: "cleared",
          clearedAt: new Date(),
          relayHandoff: handoff ? (nextAssignees.length ? handoff.mode : "ended") : null,
        })
        .where(eq(assignment.id, row.id));

      if (nextAssignees.length && row.relayId) {
        await db.insert(assignment).values(
          nextAssignees.map((next) => ({
            id: crypto.randomUUID(),
            missionId: row.missionId,
            assigneeId: next.id,
            assignerId: meId,
            relayId: row.relayId,
            parentAssignmentId: row.id,
            depth: row.depth + 1,
            pickedBy: next.pickedBy,
          })),
        );
      }

      if (row.relayId) {
        const [open] = await db
          .select({ count: sql<number>`count(*)` })
          .from(assignment)
          .where(and(eq(assignment.relayId, row.relayId), eq(assignment.status, "pending")));

        if (Number(open?.count ?? 0) === 0) {
          await db.update(relay).set({ status: "closed" }).where(eq(relay.id, row.relayId));
        }
      }

      return {
        postId,
        relayId: row.relayId,
        passedTo: nextAssignees.length,
      };
    }),
});
