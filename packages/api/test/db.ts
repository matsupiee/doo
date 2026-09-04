import { db } from "@doo/db";
import {
  account,
  assignment,
  mission,
  missionCategory,
  post,
  postReaction,
  relay,
  session,
  user,
  verification,
} from "@doo/db/schema";
import { migrate } from "drizzle-orm/libsql/migrator";

let migrated = false;

/** Applies the checked-in migrations to the throwaway test database once. */
export async function migrateTestDb() {
  if (migrated) return;
  await migrate(db, { migrationsFolder: "../db/src/migrations" });
  migrated = true;
}

/** Children first, so the foreign keys never complain. */
export async function resetTestDb() {
  await db.delete(postReaction);
  await db.delete(post);
  await db.delete(assignment);
  await db.delete(relay);
  await db.delete(missionCategory);
  await db.delete(mission);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}

let userSeq = 0;

/** `id` is left to the schema's `$defaultFn`, so hand the generated one back. */
export async function createUser(name: string) {
  userSeq += 1;
  const [row] = await db
    .insert(user)
    .values({ name, email: `user-${userSeq}-${Date.now()}@example.com` })
    .returning({ id: user.id });
  if (!row) throw new Error("Could not create the test user");
  return { id: row.id, name };
}
