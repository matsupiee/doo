import { db } from "@doo/db";
import { assignment, mission, missionCategory } from "@doo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

import type { Context } from "../src/context";
import { appRouter } from "../src/routers/index";
import { createUser, migrateTestDb, resetTestDb } from "./db";

function callerFor(userId: string) {
  return appRouter.createCaller({
    auth: null,
    session: {
      session: { id: `session_${userId}`, userId },
      user: { id: userId, name: "テスト", email: `${userId}@example.com` },
    },
  } as unknown as Context);
}

async function errorOf(call: Promise<unknown>): Promise<TRPCError> {
  try {
    await call;
  } catch (error) {
    if (error instanceof TRPCError) return error;
    throw error;
  }
  throw new Error("Expected the call to reject, but it resolved");
}

let me: { id: string; name: string };
let friend: { id: string; name: string };

beforeAll(async () => {
  await migrateTestDb();
});

beforeEach(async () => {
  await resetTestDb();
  me = await createUser("わたし");
  friend = await createUser("ともだち");
});

describe("mission.create — categories", () => {
  test("stores every category picked, in one row each", async () => {
    const result = await callerFor(me.id).mission.create({
      title: "パエリアを作る",
      categories: ["cooking", "fun"],
      assignToSelf: true,
    });

    expect(result.categories).toEqual(["cooking", "fun"]);

    const rows = await db
      .select({ category: missionCategory.category })
      .from(missionCategory)
      .where(eq(missionCategory.missionId, result.missionId));

    expect(rows.map((row) => row.category).sort()).toEqual(["cooking", "fun"]);
  });

  test("is fine with no category at all", async () => {
    const result = await callerFor(me.id).mission.create({
      title: "とりあえず作るだけ",
      assignToSelf: true,
    });

    expect(result.categories).toEqual([]);
    const rows = await db
      .select()
      .from(missionCategory)
      .where(eq(missionCategory.missionId, result.missionId));
    expect(rows).toHaveLength(0);
  });

  test("keeps a duplicated pick as a single row", async () => {
    const result = await callerFor(me.id).mission.create({
      title: "重複",
      categories: ["sports", "sports"],
      assignToSelf: true,
    });

    const rows = await db
      .select()
      .from(missionCategory)
      .where(eq(missionCategory.missionId, result.missionId));
    expect(rows).toHaveLength(1);
  });

  test("rejects a category the schema does not know", async () => {
    await expect(
      callerFor(me.id).mission.create({
        title: "知らないカテゴリ",
        // biome-ignore lint/suspicious/noExplicitAny: deliberately sending an invalid value
        categories: ["astrology"] as any,
        assignToSelf: true,
      }),
    ).rejects.toThrow();
  });
});

describe("mission.create — nobody assigned", () => {
  test("creates the mission with zero assignments", async () => {
    const result = await callerFor(me.id).mission.create({
      title: "あとで誰かに渡す",
      categories: ["outing"],
    });

    expect(result.assignmentCount).toBe(0);
    expect(result.relayId).toBeNull();

    const [row] = await db.select().from(mission).where(eq(mission.id, result.missionId));
    expect(row?.title).toBe("あとで誰かに渡す");

    const assignments = await db
      .select()
      .from(assignment)
      .where(eq(assignment.missionId, result.missionId));
    expect(assignments).toHaveLength(0);
  });

  test("shows up in `sent` with a zero count", async () => {
    await callerFor(me.id).mission.create({ title: "誰にも渡していない" });

    const sent = await callerFor(me.id).mission.sent();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.total).toBe(0);
    expect(sent[0]?.cleared).toBe(0);
  });

  test("still refuses an unassigned relay, which would have nobody to start it", async () => {
    const error = await errorOf(
      callerFor(me.id).mission.create({
        title: "走る人のいないリレー",
        relay: { enabled: true, maxNominations: 3 },
      }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });
});

describe("mission.assign", () => {
  test("hands an existing mission to someone else", async () => {
    const created = await callerFor(me.id).mission.create({ title: "あとから渡す" });

    const result = await callerFor(me.id).mission.assign({
      missionId: created.missionId,
      assigneeIds: [friend.id],
    });
    expect(result.assignmentCount).toBe(1);

    const inbox = await callerFor(friend.id).mission.inbox();
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.title).toBe("あとから渡す");
    expect(inbox[0]?.assignerName).toBe("わたし");
    expect(inbox[0]?.pickedBy).toBe("nominated");
  });

  test("lets the creator take it themselves", async () => {
    const created = await callerFor(me.id).mission.create({ title: "自分でやる" });

    await callerFor(me.id).mission.assign({ missionId: created.missionId, assignToSelf: true });

    const inbox = await callerFor(me.id).mission.inbox();
    expect(inbox[0]?.pickedBy).toBe("self");
    expect(inbox[0]?.assignerName).toBeNull();
  });

  test("does not hand the same mission to one person twice", async () => {
    const created = await callerFor(me.id).mission.create({ title: "二重付与" });

    await callerFor(me.id).mission.assign({
      missionId: created.missionId,
      assigneeIds: [friend.id],
    });
    const second = await callerFor(me.id).mission.assign({
      missionId: created.missionId,
      assigneeIds: [friend.id],
    });

    expect(second.assignmentCount).toBe(0);
    const rows = await db
      .select()
      .from(assignment)
      .where(eq(assignment.missionId, created.missionId));
    expect(rows).toHaveLength(1);
  });

  test("refuses somebody else's mission", async () => {
    const created = await callerFor(me.id).mission.create({ title: "他人のミッション" });

    const error = await errorOf(
      callerFor(friend.id).mission.assign({
        missionId: created.missionId,
        assigneeIds: [friend.id],
      }),
    );
    expect(error.code).toBe("NOT_FOUND");
  });

  test("refuses a relay mission, which is handed on by clearing it", async () => {
    const created = await callerFor(me.id).mission.create({
      title: "リレー",
      assignToSelf: true,
      relay: { enabled: true, maxNominations: 2 },
    });

    const error = await errorOf(
      callerFor(me.id).mission.assign({
        missionId: created.missionId,
        assigneeIds: [friend.id],
      }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("refuses an unknown recipient", async () => {
    const created = await callerFor(me.id).mission.create({ title: "知らない人へ" });

    const error = await errorOf(
      callerFor(me.id).mission.assign({
        missionId: created.missionId,
        assigneeIds: ["not_a_real_user"],
      }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("requires at least one recipient", async () => {
    const created = await callerFor(me.id).mission.create({ title: "宛先なし" });

    await expect(
      callerFor(me.id).mission.assign({ missionId: created.missionId }),
    ).rejects.toThrow();
  });
});

describe("categories on the read paths", () => {
  test("inbox carries the mission's categories", async () => {
    await callerFor(me.id).mission.create({
      title: "カテゴリ付き",
      categories: ["learning", "creative"],
      assigneeIds: [friend.id],
    });

    const inbox = await callerFor(friend.id).mission.inbox();
    expect(inbox[0]?.categories.sort()).toEqual(["creative", "learning"]);
  });

  test("sent carries the mission's categories", async () => {
    await callerFor(me.id).mission.create({
      title: "カテゴリ付き",
      categories: ["life"],
      assignToSelf: true,
    });

    const sent = await callerFor(me.id).mission.sent();
    expect(sent[0]?.categories).toEqual(["life"]);
  });

  test("a mission with no category reads back as an empty list, not null", async () => {
    await callerFor(me.id).mission.create({ title: "無印", assignToSelf: true });

    const inbox = await callerFor(me.id).mission.inbox();
    expect(inbox[0]?.categories).toEqual([]);
  });
});
