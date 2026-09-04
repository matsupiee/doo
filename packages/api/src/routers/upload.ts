import {
  createUploadUrl,
  isUploadContentType,
  kindOfContentType,
  maxUploadBytes,
  StorageNotConfiguredError,
  UploadTooLargeError,
  uploadContentTypes,
} from "@doo/storage";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { protectedProcedure, router } from "../index";

const contentTypeSchema = z.string().refine(isUploadContentType, {
  message: `Unsupported content type. Allowed: ${Object.keys(uploadContentTypes).join(", ")}`,
});

export const uploadRouter = router({
  /**
   * "この写真を証拠に出したい" — the app asks for a presigned PUT, sends the
   * bytes straight to R2, then passes the returned `publicUrl` to `mission.clear`.
   */
  createUploadUrl: protectedProcedure
    .input(
      z.object({
        contentType: contentTypeSchema,
        contentLength: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createUploadUrl({
          userId: ctx.session.user.id,
          contentType: input.contentType,
          contentLength: input.contentLength,
        });
        return { ...result, mediaType: kindOfContentType(input.contentType) };
      } catch (error) {
        if (error instanceof StorageNotConfiguredError) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "アップロード先が未設定です。サーバーの R2 設定を確認してください",
            cause: error,
          });
        }
        if (error instanceof UploadTooLargeError) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: `ファイルが大きすぎます（最大 ${Math.floor(error.limitBytes / 1024 / 1024)}MB）`,
            cause: error,
          });
        }
        throw error;
      }
    }),

  /** Lets the app disable the picker (and say why) instead of failing at upload time. */
  limits: protectedProcedure.query(() => ({
    maxBytes: maxUploadBytes,
    contentTypes: Object.keys(uploadContentTypes),
  })),
});
