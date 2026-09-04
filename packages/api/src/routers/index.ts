import { protectedProcedure, publicProcedure, router } from "../index";
import { feedRouter, relayRouter } from "./feed";
import { missionRouter } from "./mission";
import { uploadRouter } from "./upload";
import { userRouter } from "./user";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  user: userRouter,
  mission: missionRouter,
  feed: feedRouter,
  relay: relayRouter,
  upload: uploadRouter,
});
export type AppRouter = typeof appRouter;
