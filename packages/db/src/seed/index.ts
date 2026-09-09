import { eq } from "drizzle-orm";

import { db } from "../index";
import {
  mission,
  missionCompletion,
  missionCompletionParticipant,
  missionParticipant,
  missionTag,
  post,
  postReaction,
  user,
} from "../schema";

/**
 * `docs/user-stories/` のユーザーストーリーを手で追うためのデータを入れる。
 *
 * `bun run db:seed` で実行する。毎回同じ結果になるように、やりたいこと側の
 * テーブルは先に消す。アカウントは消さないので、同じメールアドレスの
 * シードユーザーがいれば再利用する。
 */

/** `bio` が null の人は、自己紹介を書いていないプロフィールの見え方を確かめるため。 */
const PEOPLE = [
  {
    key: "aoi",
    name: "あおい",
    email: "aoi@seed.doo.test",
    bio: "パエリアを作りたい。週末は台所にいます。",
  },
  {
    key: "haru",
    name: "はる",
    email: "haru@seed.doo.test",
    bio: "毎朝走る人。近所の坂を全部のぼるのが目標。",
  },
  { key: "mio", name: "みお", email: "mio@seed.doo.test", bio: null },
  { key: "ren", name: "れん", email: "ren@seed.doo.test", bio: null },
] as const;

type PersonKey = (typeof PEOPLE)[number]["key"];

async function seedPeople() {
  const ids = new Map<PersonKey, string>();

  for (const person of PEOPLE) {
    const existing = await db.query.user.findFirst({
      where: (row, { eq }) => eq(row.email, person.email),
      columns: { id: true },
    });

    if (existing) {
      // 何度流しても同じプロフィールになるように、名前と自己紹介は書き戻す。
      await db
        .update(user)
        .set({ name: person.name, bio: person.bio })
        .where(eq(user.id, existing.id));
      ids.set(person.key, existing.id);
      continue;
    }

    const [created] = await db
      .insert(user)
      .values({
        name: person.name,
        email: person.email,
        emailVerified: true,
        bio: person.bio,
      })
      .returning({ id: user.id });
    if (!created) throw new Error(`Could not create the seed user ${person.name}`);
    ids.set(person.key, created.id);
  }

  return ids;
}

/** 子から先に消す。外部キーに引っかからないように。 */
async function clearMissions() {
  await db.delete(missionCompletionParticipant);
  await db.delete(missionCompletion);
  await db.delete(postReaction);
  await db.delete(post);
  await db.delete(missionParticipant);
  await db.delete(missionTag);
  await db.delete(mission);
}

/** 作成者は同時に参加者になる。API の mission.create と同じ形にそろえる。 */
async function createMission(input: {
  title: string;
  description?: string;
  creatorId: string;
  tags: string[];
}) {
  const [created] = await db
    .insert(mission)
    .values({
      title: input.title,
      description: input.description ?? null,
      creatorId: input.creatorId,
    })
    .returning({ id: mission.id });
  if (!created) throw new Error(`Could not create the seed mission ${input.title}`);

  await db.insert(missionParticipant).values({ missionId: created.id, userId: input.creatorId });

  if (input.tags.length) {
    await db
      .insert(missionTag)
      .values(input.tags.map((title) => ({ missionId: created.id, title })));
  }

  return created.id;
}

async function join(missionId: string, userIds: string[]) {
  if (!userIds.length) return;
  await db.insert(missionParticipant).values(userIds.map((userId) => ({ missionId, userId })));
}

/** 達成は必ず投稿を1件持つ。達成参加者が1人なら個人達成、複数人なら共同達成。 */
async function recordCompletion(input: {
  missionId: string;
  authorId: string;
  participantIds: string[];
  caption: string;
  mediaType?: "photo" | "video" | "text";
  mediaUrl?: string;
  completedAt?: Date;
}) {
  const [createdPost] = await db
    .insert(post)
    .values({
      missionId: input.missionId,
      authorId: input.authorId,
      mediaType: input.mediaType ?? "text",
      mediaUrl: input.mediaUrl ?? null,
      caption: input.caption,
    })
    .returning({ id: post.id });
  if (!createdPost) throw new Error("Could not create the seed post");

  const [completion] = await db
    .insert(missionCompletion)
    .values({
      missionId: input.missionId,
      postId: createdPost.id,
      completedAt: input.completedAt ?? new Date(),
    })
    .returning({ id: missionCompletion.id });
  if (!completion) throw new Error("Could not create the seed completion");

  await db.insert(missionCompletionParticipant).values(
    input.participantIds.map((userId) => ({
      completionId: completion.id,
      missionId: input.missionId,
      userId,
    })),
  );

  return { completionId: completion.id, postId: createdPost.id };
}

const DAY = 24 * 60 * 60 * 1000;

export async function seed() {
  const people = await seedPeople();
  const id = (key: PersonKey) => {
    const value = people.get(key);
    if (!value) throw new Error(`Missing seed user ${key}`);
    return value;
  };

  await clearMissions();

  // 1. 参加者が複数いて、共同達成が1件あるやりたいこと。
  const paella = await createMission({
    title: "パエリアを作る",
    description: "サフランは無くてもいい。とにかく米を炊く。",
    creatorId: id("aoi"),
    tags: ["料理", "ネタ"],
  });
  await join(paella, [id("haru"), id("mio")]);
  const paellaCompletion = await recordCompletion({
    missionId: paella,
    authorId: id("aoi"),
    participantIds: [id("aoi"), id("haru")],
    caption: "3人ぶんの鍋で作った。おこげがうまい。",
    completedAt: new Date(Date.now() - 2 * DAY),
  });
  await db.insert(postReaction).values({ postId: paellaCompletion.postId, userId: id("mio") });

  // 2. 繰り返し達成するやりたいこと。同じミッションに達成が2件ぶら下がる。
  const run = await createMission({
    title: "毎朝走る",
    description: "距離は問わない。走ったら記録する。",
    creatorId: id("haru"),
    tags: ["運動"],
  });
  await recordCompletion({
    missionId: run,
    authorId: id("haru"),
    participantIds: [id("haru")],
    caption: "3km。まだ寒い。",
    completedAt: new Date(Date.now() - DAY),
  });
  await recordCompletion({
    missionId: run,
    authorId: id("haru"),
    participantIds: [id("haru")],
    caption: "今日は5km走れた。",
  });

  // 3. まだ誰も達成していない、作成者ひとりのやりたいこと。参加の動作確認に使う。
  await createMission({
    title: "近所の坂を全部のぼる",
    description: "地図に載っていない坂でもいい。",
    creatorId: id("aoi"),
    tags: ["運動", "おでかけ"],
  });

  // 4. タグが1つも付いていないやりたいこと。進捗報告だけがある。
  const write = await createMission({
    title: "とりあえず何か書く",
    creatorId: id("mio"),
    tags: [],
  });
  await db.insert(post).values({
    missionId: write,
    authorId: id("mio"),
    mediaType: "text",
    caption: "書き出しだけ決めた。まだ達成ではない。",
  });

  // 5. 作成者が達成していないやりたいこと。退出できる参加者がいる状態を作る。
  const station = await createMission({
    title: "知らない駅で降りて写真を撮る",
    description: "普段は乗り換えるだけの駅でもいい。",
    creatorId: id("ren"),
    tags: ["おでかけ", "つくる"],
  });
  await join(station, [id("mio")]);
  await recordCompletion({
    missionId: station,
    authorId: id("mio"),
    participantIds: [id("mio")],
    caption: "各駅停車で3つ先まで行った。",
  });

  return {
    users: PEOPLE.map((person) => ({ ...person, id: id(person.key) })),
    missions: 5,
  };
}

const summary = await seed();
console.log("seeded:");
for (const person of summary.users) {
  console.log(`  ${person.name} <${person.email}> ${person.id}`);
}
console.log(`  ${summary.missions} missions`);
