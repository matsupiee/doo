import { TRPCError } from "@trpc/server";

import type { Context } from "../src/context";
import { appRouter } from "../src/routers/index";

/** Signed-in caller for one user, without going through better-auth. */
export function callerFor(userId: string) {
  return appRouter.createCaller({
    auth: null,
    session: {
      session: { id: `session_${userId}`, userId },
      user: { id: userId, name: "テスト", email: `${userId}@example.com` },
    },
  } as unknown as Context);
}

export async function errorOf(call: Promise<unknown>): Promise<TRPCError> {
  try {
    await call;
  } catch (error) {
    if (error instanceof TRPCError) return error;
    throw error;
  }
  throw new Error("Expected the call to reject, but it resolved");
}
