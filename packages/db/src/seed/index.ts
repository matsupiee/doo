import { db } from "../index";
import {
  assignment,
  mission,
  missionCategory,
  post,
  postReaction,
  relay,
  user,
} from "../schema";

/**
 * Fills the database with the cast and the missions the user stories in
 * `docs/user-stories/` are written against.
 *
 * Run it with `bun run db:seed`. It wipes the mission-side tables first so the
 * result is the same every time; accounts and their credentials are left alone
 * unless a seeded user with the same e-mail already exists.
 */

const PEOPLE = [
  { key: "aoi", name: "あおい", email: "aoi@seed.doo.test" },
  { key: "haru", name: "はる", email: "haru@seed.doo.test" },
  { key: "mio", name: "みお", email: "mio@seed.doo.test" },
  { key: "ren", name: "れん", email: "ren@seed.doo.test" },
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
      ids.set(person.key, existing.id);
      continue;
    }

    const [created] = await db
      .insert(user)
      .values({ name: person.name, email: person.email, emailVerified: true })
      .returning({ id: user.id });
    if (!created) throw new Error(`Could not create the seed user ${person.name}`);
    ids.set(person.key, created.id);
  }

  return ids;
}

/** Children first, so the foreign keys never complain. */
async function clearMissions() {
  await db.delete(postReaction);
  await db.delete(post);
  await db.delete(assignment);
  await db.delete(relay);
  await db.delete(missionCategory);
  await db.delete(mission);
}

async function createMission(input: {
  title: string;
  description?: string;
  proofHint?: string;
  creatorId: string;
  categories: string[];
}) {
  const [created] = await db
    .insert(mission)
    .values({
      title: input.title,
      description: input.description ?? null,
      proofHint: input.proofHint ?? null,
      creatorId: input.creatorId,
    })
    .returning({ id: mission.id });
  if (!created) throw new Error(`Could not create the seed mission ${input.title}`);

  if (input.categories.length) {
    await db.insert(missionCategory).values(
      input.categories.map((category) => ({
        missionId: created.id,
        category: category as "cooking",
      })),
    );
  }

  return created.id;
}

export async function seed() {
  const people = await seedPeople();
  const id = (key: PersonKey) => {
    const value = people.get(key);
    if (!value) throw new Error(`Missing seed user ${key}`);
    return value;
  };

  await clearMissions();

  // 1. A multi-category mission handed to two friends.
  const paella = await createMission({
    title: "パエリアを作ってみて",
    description: "サフランは無くてもいい。とにかく米を炊いて。",
    proofHint: "完成した皿の写真を撮って",
    creatorId: id("aoi"),
    categories: ["cooking", "fun"],
  });
  await db.insert(assignment).values([
    { missionId: paella, assigneeId: id("haru"), assignerId: id("aoi"), pickedBy: "nominated" },
    { missionId: paella, assigneeId: id("mio"), assignerId: id("aoi"), pickedBy: "nominated" },
  ]);

  // 2. A mission created with nobody on it — the "あとで渡す" case.
  await createMission({
    title: "近所の坂を全部のぼる",
    description: "地図に載ってない坂でもいい。",
    creatorId: id("aoi"),
    categories: ["sports", "outing"],
  });

  // 3. A mission with no category at all, taken by its creator.
  const noCategory = await createMission({
    title: "とりあえず何か書く",
    creatorId: id("mio"),
    categories: [],
  });
  await db
    .insert(assignment)
    .values({ missionId: noCategory, assigneeId: id("mio"), pickedBy: "self" });

  // 4. A relay that has already run one leg, so the feed and the tree have content.
  const relayMissionId = await createMission({
    title: "知らない駅で降りて写真を撮る",
    description: "普段乗り換えるだけの駅でもOK。",
    proofHint: "駅名がわかる写真",
    creatorId: id("ren"),
    categories: ["outing", "creative"],
  });
  const [relayRow] = await db
    .insert(relay)
    .values({ missionId: relayMissionId, starterId: id("ren"), maxNominations: 2 })
    .returning({ id: relay.id });
  if (!relayRow) throw new Error("Could not create the seed relay");

  const [firstLeg] = await db
    .insert(assignment)
    .values({
      missionId: relayMissionId,
      assigneeId: id("ren"),
      relayId: relayRow.id,
      depth: 0,
      pickedBy: "self",
      status: "cleared",
      relayHandoff: "nominated",
      clearedAt: new Date(),
    })
    .returning({ id: assignment.id });
  if (!firstLeg) throw new Error("Could not create the seed relay leg");

  const [firstPost] = await db
    .insert(post)
    .values({
      assignmentId: firstLeg.id,
      missionId: relayMissionId,
      authorId: id("ren"),
      mediaType: "text",
      caption: "各駅停車で3つ先まで行った",
    })
    .returning({ id: post.id });
  if (!firstPost) throw new Error("Could not create the seed post");

  await db.insert(postReaction).values({ postId: firstPost.id, userId: id("aoi") });

  await db.insert(assignment).values({
    missionId: relayMissionId,
    assigneeId: id("haru"),
    assignerId: id("ren"),
    relayId: relayRow.id,
    parentAssignmentId: firstLeg.id,
    depth: 1,
    pickedBy: "nominated",
  });

  return {
    users: PEOPLE.map((person) => ({ ...person, id: id(person.key) })),
    missions: 4,
  };
}

const summary = await seed();
console.log("seeded:");
for (const person of summary.users) {
  console.log(`  ${person.name} <${person.email}> ${person.id}`);
}
console.log(`  ${summary.missions} missions`);
