import { db } from "@doo/db";
import {
  missionCompletion,
  missionCompletionParticipant,
  missionParticipant,
  missionTag,
  post,
} from "@doo/db/schema";
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { callerFor, errorOf } from "./caller";
import { createUser, migrateTestDb, resetTestDb } from "./db";

let me: { id: string; name: string };
let friend: { id: string; name: string };
let stranger: { id: string; name: string };

beforeAll(async () => {
  await migrateTestDb();
});

beforeEach(async () => {
  await resetTestDb();
  me = await createUser("わたし");
  friend = await createUser("ともだち");
  stranger = await createUser("しらないひと");
});

/** docs/user-stories/create-mission.md */
describe("mission.create — やりたいことを登録する", () => {
  test("タイトルだけで登録できる", async () => {
    const created = await callerFor(me.id).mission.create({ title: "パエリアを作る" });

    const detail = await callerFor(me.id).mission.get({ missionId: created.missionId });
    expect(detail.title).toBe("パエリアを作る");
    expect(detail.description).toBeNull();
    expect(detail.creatorId).toBe(me.id);
    expect(detail.tags).toEqual([]);
  });

  test("作成者は同時に参加者になる", async () => {
    const created = await callerFor(me.id).mission.create({ title: "毎朝走る" });

    const detail = await callerFor(me.id).mission.get({ missionId: created.missionId });
    expect(detail.participants.map((row) => row.userId)).toEqual([me.id]);
    expect(detail.isParticipant).toBe(true);
    expect(detail.completions).toEqual([]);
  });

  test("一覧に参加者数と達成件数が出る", async () => {
    const created = await callerFor(me.id).mission.create({ title: "毎朝走る" });
    await callerFor(friend.id).mission.join({ missionId: created.missionId });
    await callerFor(me.id).mission.complete({ missionId: created.missionId, caption: "走った" });

    const [row] = await callerFor(me.id).mission.mine();
    expect(row?.participantCount).toBe(2);
    expect(row?.completionCount).toBe(1);

    const [joined] = await callerFor(friend.id).mission.participating();
    expect(joined?.participantCount).toBe(2);
    expect(joined?.myCompletionCount).toBe(0);
  });

  test("自分が作ったものが新しい順に並ぶ", async () => {
    await callerFor(me.id).mission.create({ title: "古いほう" });
    await callerFor(me.id).mission.create({ title: "新しいほう" });
    await callerFor(friend.id).mission.create({ title: "他人のもの" });

    const mine = await callerFor(me.id).mission.mine();
    expect(mine.map((row) => row.title)).toEqual(["新しいほう", "古いほう"]);
  });

  test("他のユーザーからも見えて、参加できる", async () => {
    const created = await callerFor(me.id).mission.create({ title: "近所の坂を全部のぼる" });

    const seen = await callerFor(friend.id).mission.get({ missionId: created.missionId });
    expect(seen.title).toBe("近所の坂を全部のぼる");
    expect(seen.isParticipant).toBe(false);
  });
});

/** docs/user-stories/mission-tags.md */
describe("mission.create — タグ", () => {
  test("自由入力のタグを複数つけられる", async () => {
    const created = await callerFor(me.id).mission.create({
      title: "パエリアを作る",
      tags: ["料理", "ネタ"],
    });

    const rows = await db
      .select({ title: missionTag.title })
      .from(missionTag)
      .where(eq(missionTag.missionId, created.missionId));

    expect(rows.map((row) => row.title).sort()).toEqual(["ネタ", "料理"]);
  });

  test("同じタグを2回書いても二重に保存されない", async () => {
    const created = await callerFor(me.id).mission.create({
      title: "パエリアを作る",
      tags: ["料理", "料理"],
    });

    const detail = await callerFor(me.id).mission.get({ missionId: created.missionId });
    expect(detail.tags).toEqual(["料理"]);
  });

  test("空白だけのタグは BAD_REQUEST", async () => {
    const error = await errorOf(
      callerFor(me.id).mission.create({ title: "パエリアを作る", tags: ["   "] }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("タグなしでも登録でき、[] が返る", async () => {
    const created = await callerFor(me.id).mission.create({ title: "とりあえず何か書く" });
    expect(created.tags).toEqual([]);

    const detail = await callerFor(me.id).mission.get({ missionId: created.missionId });
    expect(detail.tags).toEqual([]);
  });
});

/** docs/user-stories/participate-in-mission.md */
describe("mission.join / mission.leave — 参加と退出", () => {
  async function missionByMe() {
    const created = await callerFor(me.id).mission.create({ title: "パエリアを作る" });
    return created.missionId;
  }

  test("承認なしでその場で参加でき、参加者一覧に出る", async () => {
    const missionId = await missionByMe();

    const result = await callerFor(friend.id).mission.join({ missionId });
    expect(result.joined).toBe(true);

    const detail = await callerFor(friend.id).mission.get({ missionId });
    expect(detail.participants.map((row) => row.userId)).toEqual([me.id, friend.id]);
    expect(detail.isParticipant).toBe(true);
  });

  test("何度参加しても参加者は増えない", async () => {
    const missionId = await missionByMe();

    await callerFor(friend.id).mission.join({ missionId });
    const again = await callerFor(friend.id).mission.join({ missionId });
    expect(again.joined).toBe(false);

    const detail = await callerFor(friend.id).mission.get({ missionId });
    expect(detail.participants).toHaveLength(2);
  });

  test("達成していなければ退出できる", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });

    await callerFor(friend.id).mission.leave({ missionId });

    const detail = await callerFor(friend.id).mission.get({ missionId });
    expect(detail.participants.map((row) => row.userId)).toEqual([me.id]);
  });

  test("自分の達成があると退出できない", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });
    await callerFor(friend.id).mission.complete({ missionId, caption: "できた" });

    const error = await errorOf(callerFor(friend.id).mission.leave({ missionId }));
    expect(error.code).toBe("BAD_REQUEST");

    const detail = await callerFor(friend.id).mission.get({ missionId });
    expect(detail.participants.map((row) => row.userId)).toContain(friend.id);
  });

  test("他人が達成しているだけなら退出できる", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });
    await callerFor(me.id).mission.complete({ missionId, caption: "わたしだけ達成した" });

    await callerFor(friend.id).mission.leave({ missionId });

    const detail = await callerFor(me.id).mission.get({ missionId });
    expect(detail.participants.map((row) => row.userId)).toEqual([me.id]);
    expect(detail.completions).toHaveLength(1);
  });

  test("誰かが抜けても、他の人の達成参加は消えない", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });
    await callerFor(stranger.id).mission.join({ missionId });
    const completion = await callerFor(me.id).mission.complete({
      missionId,
      participantIds: [friend.id],
      caption: "2人で達成した",
    });

    // stranger は達成していないので抜けられる。
    await callerFor(stranger.id).mission.leave({ missionId });

    const rows = await db
      .select({ userId: missionCompletionParticipant.userId })
      .from(missionCompletionParticipant)
      .where(eq(missionCompletionParticipant.completionId, completion.completionId));
    expect(rows.map((row) => row.userId).sort()).toEqual([me.id, friend.id].sort());
  });

  test("作成者は自分のやりたいことから抜けられない", async () => {
    const missionId = await missionByMe();

    const error = await errorOf(callerFor(me.id).mission.leave({ missionId }));
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("参加していない人の退出は NOT_FOUND", async () => {
    const missionId = await missionByMe();

    const error = await errorOf(callerFor(friend.id).mission.leave({ missionId }));
    expect(error.code).toBe("NOT_FOUND");
  });

  test("作成者はやりたいことごと削除できる", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });

    const forbidden = await errorOf(callerFor(friend.id).mission.remove({ missionId }));
    expect(forbidden.code).toBe("FORBIDDEN");

    await callerFor(me.id).mission.remove({ missionId });
    const gone = await errorOf(callerFor(me.id).mission.get({ missionId }));
    expect(gone.code).toBe("NOT_FOUND");
  });
});

/** docs/user-stories/record-completion.md */
describe("mission.complete — 達成を記録する", () => {
  async function missionByMe() {
    const created = await callerFor(me.id).mission.create({ title: "毎朝走る" });
    return created.missionId;
  }

  test("達成には必ず投稿が1件ついて、個人達成になる", async () => {
    const missionId = await missionByMe();

    const result = await callerFor(me.id).mission.complete({ missionId, caption: "3km走った" });
    expect(result.isShared).toBe(false);
    expect(result.participantIds).toEqual([me.id]);

    const [row] = await db
      .select({ postId: missionCompletion.postId })
      .from(missionCompletion)
      .where(eq(missionCompletion.id, result.completionId));
    expect(row?.postId).toBe(result.postId);
  });

  test("複数人を選ぶと共同達成になり、投稿は1件だけ", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });

    const result = await callerFor(me.id).mission.complete({
      missionId,
      participantIds: [friend.id],
      caption: "2人で走った",
    });
    expect(result.isShared).toBe(true);

    const posts = await db.select({ id: post.id }).from(post).where(eq(post.missionId, missionId));
    expect(posts).toHaveLength(1);

    const detail = await callerFor(me.id).mission.get({ missionId });
    expect(detail.completions).toHaveLength(1);
    expect(detail.completions[0]?.participants.map((row) => row.userId).sort()).toEqual(
      [me.id, friend.id].sort(),
    );
  });

  test("同じ人を二重に指定しても1行にしかならない", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });

    const result = await callerFor(me.id).mission.complete({
      missionId,
      participantIds: [friend.id, friend.id, me.id],
      caption: "2人で走った",
    });

    expect(result.participantIds.sort()).toEqual([me.id, friend.id].sort());

    const rows = await db
      .select({ userId: missionCompletionParticipant.userId })
      .from(missionCompletionParticipant)
      .where(eq(missionCompletionParticipant.completionId, result.completionId));
    expect(rows).toHaveLength(2);
  });

  test("未参加の人を含めると、その場で参加者になる", async () => {
    const missionId = await missionByMe();

    const result = await callerFor(me.id).mission.complete({
      missionId,
      participantIds: [stranger.id],
      caption: "その場で誘った",
    });
    expect(result.addedParticipantIds).toEqual([stranger.id]);

    const [participant] = await db
      .select({ userId: missionParticipant.userId })
      .from(missionParticipant)
      .where(
        and(
          eq(missionParticipant.missionId, missionId),
          eq(missionParticipant.userId, stranger.id),
        ),
      );
    expect(participant?.userId).toBe(stranger.id);

    const detail = await callerFor(me.id).mission.get({ missionId });
    expect(detail.participants.map((row) => row.userId)).toContain(stranger.id);
  });

  test("達成日時を指定できる。未指定なら記録時刻", async () => {
    const missionId = await missionByMe();
    const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const withDate = await callerFor(me.id).mission.complete({
      missionId,
      completedAt: lastWeek,
      caption: "先週の話",
    });
    const withoutDate = await callerFor(me.id).mission.complete({ missionId, caption: "今日" });

    const rows = await db
      .select({ id: missionCompletion.id, completedAt: missionCompletion.completedAt })
      .from(missionCompletion)
      .where(eq(missionCompletion.missionId, missionId));

    const dated = rows.find((row) => row.id === withDate.completionId);
    const undated = rows.find((row) => row.id === withoutDate.completionId);
    expect(dated?.completedAt.getTime()).toBe(lastWeek);
    expect(undated?.completedAt.getTime()).toBeGreaterThan(lastWeek);
  });

  test("同じやりたいことを何度でも達成として記録できる", async () => {
    const missionId = await missionByMe();

    await callerFor(me.id).mission.complete({ missionId, caption: "1回目" });
    await callerFor(me.id).mission.complete({ missionId, caption: "2回目" });

    const detail = await callerFor(me.id).mission.get({ missionId });
    expect(detail.completions).toHaveLength(2);
    expect(detail.myCompletionCount).toBe(2);
  });

  test("参加していないやりたいことの達成は記録できない", async () => {
    const created = await callerFor(friend.id).mission.create({ title: "他人のやりたいこと" });

    const error = await errorOf(
      callerFor(me.id).mission.complete({ missionId: created.missionId, caption: "勝手に達成" }),
    );
    expect(error.code).toBe("FORBIDDEN");
  });

  test("写真の達成には URL が要る", async () => {
    const missionId = await missionByMe();

    const error = await errorOf(
      callerFor(me.id).mission.complete({ missionId, mediaType: "photo" }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("進捗報告は投稿だけを作り、達成一覧には並ばない", async () => {
    const missionId = await missionByMe();

    const progress = await callerFor(me.id).mission.postProgress({
      missionId,
      caption: "まだ途中",
    });

    const detail = await callerFor(me.id).mission.get({ missionId });
    expect(detail.completions).toEqual([]);

    const posts = await db.select({ id: post.id }).from(post).where(eq(post.missionId, missionId));
    expect(posts.map((row) => row.id)).toEqual([progress.postId]);
  });

  test("共同達成は参加した全員のプロフィールに並ぶ", async () => {
    const missionId = await missionByMe();
    await callerFor(friend.id).mission.join({ missionId });
    await callerFor(me.id).mission.complete({
      missionId,
      participantIds: [friend.id],
      caption: "2人で走った",
    });

    const mine = await callerFor(me.id).user.myCompletions();
    const theirs = await callerFor(friend.id).user.myCompletions();

    expect(mine).toHaveLength(1);
    expect(theirs).toHaveLength(1);
    expect(theirs[0]?.completionId).toBe(mine[0]!.completionId);
  });
});
