import { db } from "@doo/db";
import { user } from "@doo/db/schema";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { callerFor, errorOf, signedOutCaller } from "./caller";
import { createUser, migrateTestDb, resetTestDb } from "./db";

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

/** docs/user-stories/edit-profile.md */
describe("user.updateProfile — プロフィールを編集する", () => {
  test("名前・アイコン・自己紹介をまとめて保存できる", async () => {
    const saved = await callerFor(me.id).user.updateProfile({
      name: "あたらしい名前",
      bio: "毎朝走っています",
      image: "https://media.example.com/posts/me/avatar.jpg",
    });

    expect(saved).toEqual({
      name: "あたらしい名前",
      bio: "毎朝走っています",
      image: "https://media.example.com/posts/me/avatar.jpg",
    });

    const mine = await callerFor(me.id).user.me();
    expect(mine.name).toBe("あたらしい名前");
    expect(mine.bio).toBe("毎朝走っています");
    expect(mine.image).toBe("https://media.example.com/posts/me/avatar.jpg");
  });

  test("保存した内容は他の人のプロフィール表示にも出る", async () => {
    await callerFor(me.id).user.updateProfile({
      name: "あおい",
      bio: "パエリアを作りたい",
      image: "https://media.example.com/posts/me/avatar.jpg",
    });

    const seen = await callerFor(friend.id).user.profile({ userId: me.id });
    expect(seen.user.name).toBe("あおい");
    expect(seen.user.bio).toBe("パエリアを作りたい");
    expect(seen.user.image).toBe("https://media.example.com/posts/me/avatar.jpg");
  });

  test("自己紹介とアイコンを省くと、保存済みの内容が消える", async () => {
    await callerFor(me.id).user.updateProfile({
      name: "わたし",
      bio: "はじめまして",
      image: "https://media.example.com/posts/me/avatar.jpg",
    });

    await callerFor(me.id).user.updateProfile({ name: "わたし" });

    const mine = await callerFor(me.id).user.me();
    expect(mine.bio).toBeNull();
    expect(mine.image).toBeNull();
  });

  test("空白だけの自己紹介は null として保存される", async () => {
    await callerFor(me.id).user.updateProfile({ name: "わたし", bio: "   " });

    const mine = await callerFor(me.id).user.me();
    expect(mine.bio).toBeNull();
  });

  test("名前と自己紹介の前後の空白は落とす", async () => {
    await callerFor(me.id).user.updateProfile({ name: "  あおい  ", bio: "  走る  " });

    const mine = await callerFor(me.id).user.me();
    expect(mine.name).toBe("あおい");
    expect(mine.bio).toBe("走る");
  });

  test("編集できるのは自分のアカウントだけで、他の人は変わらない", async () => {
    await callerFor(me.id).user.updateProfile({ name: "あおい", bio: "走る" });

    const [other] = await db
      .select({ name: user.name, bio: user.bio })
      .from(user)
      .where(eq(user.id, friend.id));
    expect(other?.name).toBe("ともだち");
    expect(other?.bio).toBeNull();
  });

  test("空の名前は BAD_REQUEST で、保存前の名前が残る", async () => {
    const error = await errorOf(callerFor(me.id).user.updateProfile({ name: "   " }));
    expect(error.code).toBe("BAD_REQUEST");

    const mine = await callerFor(me.id).user.me();
    expect(mine.name).toBe("わたし");
  });

  test("40文字を超える名前は BAD_REQUEST", async () => {
    const error = await errorOf(callerFor(me.id).user.updateProfile({ name: "あ".repeat(41) }));
    expect(error.code).toBe("BAD_REQUEST");

    await callerFor(me.id).user.updateProfile({ name: "あ".repeat(40) });
    const mine = await callerFor(me.id).user.me();
    expect(mine.name).toBe("あ".repeat(40));
  });

  test("200文字を超える自己紹介は BAD_REQUEST", async () => {
    const error = await errorOf(
      callerFor(me.id).user.updateProfile({ name: "わたし", bio: "あ".repeat(201) }),
    );
    expect(error.code).toBe("BAD_REQUEST");

    await callerFor(me.id).user.updateProfile({ name: "わたし", bio: "あ".repeat(200) });
    const mine = await callerFor(me.id).user.me();
    expect(mine.bio).toBe("あ".repeat(200));
  });

  test("URL でないアイコンは BAD_REQUEST", async () => {
    const error = await errorOf(
      callerFor(me.id).user.updateProfile({ name: "わたし", image: "avatar.jpg" }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("サインインしていないと UNAUTHORIZED", async () => {
    const error = await errorOf(signedOutCaller().user.updateProfile({ name: "だれか" }));
    expect(error.code).toBe("UNAUTHORIZED");
  });
});
