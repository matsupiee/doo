import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { callerFor, errorOf } from "./caller";
import { createUser, migrateTestDb, resetTestDb } from "./db";

let me: { id: string; name: string };
let friend: { id: string; name: string };

/** やりたいことを1つ作って、達成として1件投稿する。 */
async function completeNewMission(title: string, tags: string[]) {
  const caller = callerFor(me.id);
  const created = await caller.mission.create({ title, tags });
  const { postId, completionId } = await caller.mission.complete({
    missionId: created.missionId,
    caption: "やった",
  });
  return { missionId: created.missionId, postId, completionId };
}

beforeAll(async () => {
  await migrateTestDb();
});

beforeEach(async () => {
  await resetTestDb();
  me = await createUser("わたし");
  friend = await createUser("ともだち");
});

/** docs/user-stories/filter-feed-by-tag.md */
describe("feed.list — タグで絞り込む", () => {
  test("何も選ばなければ全件が新しい順に並ぶ", async () => {
    await completeNewMission("パエリアを作る", ["料理"]);
    await completeNewMission("毎朝走る", ["運動"]);

    const feed = await callerFor(friend.id).feed.list({ limit: 20, tags: [] });
    expect(feed.items.map((item) => item.missionTitle)).toEqual(["毎朝走る", "パエリアを作る"]);
  });

  test("タグを1つ選ぶと、そのタグの投稿だけ残る", async () => {
    await completeNewMission("パエリアを作る", ["料理"]);
    await completeNewMission("毎朝走る", ["運動"]);

    const feed = await callerFor(me.id).feed.list({ limit: 20, tags: ["料理"] });
    expect(feed.items.map((item) => item.missionTitle)).toEqual(["パエリアを作る"]);
  });

  test("タグを2つ選ぶと、どれかに一致する投稿が並ぶ（OR）", async () => {
    await completeNewMission("パエリアを作る", ["料理"]);
    await completeNewMission("毎朝走る", ["運動"]);
    await completeNewMission("とりあえず何か書く", []);

    const feed = await callerFor(me.id).feed.list({ limit: 20, tags: ["料理", "運動"] });
    expect(feed.items.map((item) => item.missionTitle).sort()).toEqual(
      ["パエリアを作る", "毎朝走る"].sort(),
    );
  });

  test("複数のタグに一致する投稿でも1回しか出ない", async () => {
    await completeNewMission("パエリアを作る", ["料理", "ネタ"]);

    const feed = await callerFor(me.id).feed.list({ limit: 20, tags: ["料理", "ネタ"] });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.missionTags.sort()).toEqual(["ネタ", "料理"]);
  });

  test("使われていないタグを選ぶと空になる", async () => {
    await completeNewMission("パエリアを作る", ["料理"]);

    const feed = await callerFor(me.id).feed.list({ limit: 20, tags: ["学び"] });
    expect(feed.items).toEqual([]);
    expect(feed.nextCursor).toBeNull();
  });

  test("絞り込んだままページングしても壊れない", async () => {
    for (const title of ["1つめ", "2つめ", "3つめ"]) {
      await completeNewMission(title, ["運動"]);
    }

    const first = await callerFor(me.id).feed.list({ limit: 2, tags: ["運動"] });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();

    const second = await callerFor(me.id).feed.list({
      limit: 2,
      tags: ["運動"],
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.missionTitle).toBe("1つめ");
    expect(second.nextCursor).toBeNull();
  });
});

describe("feed.tags — 実際に使われているタグ", () => {
  test("使われているタグだけを、使われている数の多い順に返す", async () => {
    await completeNewMission("パエリアを作る", ["料理", "ネタ"]);
    await completeNewMission("味噌汁を作る", ["料理"]);

    const tags = await callerFor(me.id).feed.tags();
    expect(tags).toEqual([
      { title: "料理", missionCount: 2 },
      { title: "ネタ", missionCount: 1 },
    ]);
  });
});

describe("feed.list — 投稿の中身", () => {
  test("達成報告には達成の参加者が並び、進捗報告には並ばない", async () => {
    const created = await callerFor(me.id).mission.create({ title: "毎朝走る" });
    await callerFor(friend.id).mission.join({ missionId: created.missionId });
    await callerFor(me.id).mission.complete({
      missionId: created.missionId,
      participantIds: [friend.id],
      caption: "2人で走った",
    });
    await callerFor(me.id).mission.postProgress({
      missionId: created.missionId,
      caption: "まだ途中",
    });

    const feed = await callerFor(me.id).feed.list({ limit: 20, tags: [] });
    const [progress, completion] = feed.items;

    expect(progress?.completionId).toBeNull();
    expect(progress?.completionParticipants).toEqual([]);
    expect(completion?.completionId).not.toBeNull();
    expect(completion?.completionParticipants.map((row) => row.userId).sort()).toEqual(
      [me.id, friend.id].sort(),
    );
  });
});

describe("feed.toggleReaction", () => {
  test("押すと付き、もう一度押すと外れる", async () => {
    const { postId } = await completeNewMission("パエリアを作る", []);

    expect(await callerFor(friend.id).feed.toggleReaction({ postId })).toEqual({ reacted: true });

    const feed = await callerFor(friend.id).feed.list({ limit: 20, tags: [] });
    expect(feed.items[0]?.reactionCount).toBe(1);
    expect(feed.items[0]?.reactedByMe).toBe(true);

    expect(await callerFor(friend.id).feed.toggleReaction({ postId })).toEqual({ reacted: false });
  });

  test("知らない投稿は NOT_FOUND", async () => {
    const error = await errorOf(callerFor(me.id).feed.toggleReaction({ postId: "unknown" }));
    expect(error.code).toBe("NOT_FOUND");
  });
});
