import { TRPCError } from "@trpc/server";
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

let me: { id: string; name: string };

/** Creates a mission for myself, clears it, and returns the post id. */
async function postCleared(title: string, categories: string[]) {
  const caller = callerFor(me.id);
  const created = await caller.mission.create({
    title,
    // biome-ignore lint/suspicious/noExplicitAny: the test names categories as plain strings
    categories: categories as any,
    assignToSelf: true,
  });
  const inbox = await caller.mission.inbox();
  const item = inbox.find((entry) => entry.missionId === created.missionId);
  if (!item) throw new Error(`Could not find the assignment for ${title}`);
  const { postId } = await caller.mission.clear({
    assignmentId: item.assignmentId,
    mediaType: "text",
    caption: "やった",
  });
  return postId;
}

beforeAll(async () => {
  await migrateTestDb();
});

beforeEach(async () => {
  await resetTestDb();
  me = await createUser("わたし");
});

describe("feed.list — categories", () => {
  test("each post carries its mission's categories", async () => {
    await postCleared("パエリア", ["cooking"]);

    const feed = await callerFor(me.id).feed.list({ limit: 20, categories: [] });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.missionCategories).toEqual(["cooking"]);
  });

  test("a post whose mission has no category reads back as an empty list", async () => {
    await postCleared("無印", []);

    const feed = await callerFor(me.id).feed.list({ limit: 20, categories: [] });
    expect(feed.items[0]?.missionCategories).toEqual([]);
  });

  test("filters down to the categories asked for", async () => {
    await postCleared("パエリア", ["cooking"]);
    await postCleared("ランニング", ["sports"]);
    await postCleared("無印", []);

    const cooking = await callerFor(me.id).feed.list({ limit: 20, categories: ["cooking"] });
    expect(cooking.items.map((item) => item.missionTitle)).toEqual(["パエリア"]);
  });

  test("an empty filter shows everything", async () => {
    await postCleared("パエリア", ["cooking"]);
    await postCleared("ランニング", ["sports"]);

    const all = await callerFor(me.id).feed.list({ limit: 20, categories: [] });
    expect(all.items).toHaveLength(2);
  });

  test("several categories are OR'd, and a mission is listed once even if it matches twice", async () => {
    await postCleared("パエリア", ["cooking", "fun"]);
    await postCleared("ランニング", ["sports"]);
    await postCleared("無印", []);

    const picked = await callerFor(me.id).feed.list({
      limit: 20,
      categories: ["cooking", "fun"],
    });
    expect(picked.items).toHaveLength(1);
    expect(picked.items[0]?.missionTitle).toBe("パエリア");
  });

  test("a filter that matches nothing returns an empty page", async () => {
    await postCleared("パエリア", ["cooking"]);

    const none = await callerFor(me.id).feed.list({ limit: 20, categories: ["learning"] });
    expect(none.items).toHaveLength(0);
    expect(none.nextCursor).toBeNull();
  });

  test("relay.get carries the mission's categories", async () => {
    const caller = callerFor(me.id);
    const created = await caller.mission.create({
      title: "リレー",
      categories: ["fun", "outing"],
      assignToSelf: true,
      relay: { enabled: true, maxNominations: 2 },
    });
    if (!created.relayId) throw new Error("Expected a relay to be created");

    const detail = await caller.relay.get({ relayId: created.relayId });
    expect(detail.relay.categories.sort()).toEqual(["fun", "outing"]);
  });

  test("rejects a category outside the schema's list", async () => {
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: deliberately sending an invalid value
      callerFor(me.id).feed.list({ limit: 20, categories: ["astrology"] as any }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
