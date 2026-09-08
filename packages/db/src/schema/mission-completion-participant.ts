import { text, primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";
import { missionCompletion } from "./mission-completion";
import { user } from "./user";

export const missionCompletionParticipant = sqliteTable(
  "mission_completion_participant",
  {
    completionId: text("completion_id")
      .notNull()
      .references(() => missionCompletion.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.completionId, table.userId],
    }),
  ],
);
