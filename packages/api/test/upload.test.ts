import { TRPCError } from "@trpc/server";
import { describe, expect, test } from "bun:test";

import type { Context } from "../src/context";
import { appRouter } from "../src/routers/index";

const session = {
  session: { id: "session_1", userId: "user_1" },
  user: { id: "user_1", name: "テスト太郎", email: "test@example.com" },
} as unknown as NonNullable<Context["session"]>;

const signedIn = () => appRouter.createCaller({ auth: null, session });
const signedOut = () => appRouter.createCaller({ auth: null, session: null });

async function errorOf(call: Promise<unknown>): Promise<TRPCError> {
  try {
    await call;
  } catch (error) {
    if (error instanceof TRPCError) return error;
    throw error;
  }
  throw new Error("Expected the call to reject, but it resolved");
}

describe("upload.createUploadUrl", () => {
  test("returns a presigned PUT plus the public URL to store on the post", async () => {
    const result = await signedIn().upload.createUploadUrl({
      contentType: "image/jpeg",
      contentLength: 2048,
    });

    expect(result.key).toMatch(/^posts\/user_1\/[a-z0-9]+\.jpg$/);
    expect(result.mediaType).toBe("photo");
    expect(result.publicUrl).toBe(`https://media.example.com/${result.key}`);
    expect(result.expiresInSeconds).toBe(300);

    const url = new URL(result.uploadUrl);
    expect(url.origin).toBe("https://test-account.r2.cloudflarestorage.com");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });

  test("scopes the key to the caller, not to anything the client sends", async () => {
    const other = appRouter.createCaller({
      auth: null,
      session: {
        ...session,
        user: { ...session.user, id: "user_2" },
      },
    } as Context);

    const result = await other.upload.createUploadUrl({
      contentType: "video/mp4",
      contentLength: 2048,
    });
    expect(result.key).toStartWith("posts/user_2/");
    expect(result.mediaType).toBe("video");
  });

  test("rejects a content type we do not accept", async () => {
    const error = await errorOf(
      signedIn().upload.createUploadUrl({
        contentType: "application/pdf",
        contentLength: 2048,
      }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("rejects a zero-byte upload", async () => {
    const error = await errorOf(
      signedIn().upload.createUploadUrl({ contentType: "image/png", contentLength: 0 }),
    );
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("rejects a photo over the 10MB cap", async () => {
    const error = await errorOf(
      signedIn().upload.createUploadUrl({
        contentType: "image/jpeg",
        contentLength: 10485761,
      }),
    );
    expect(error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  test("still accepts a 12MB video, which is under the video cap", async () => {
    const result = await signedIn().upload.createUploadUrl({
      contentType: "video/mp4",
      contentLength: 12 * 1024 * 1024,
    });
    expect(result.key).toEndWith(".mp4");
  });

  test("requires a session", async () => {
    const error = await errorOf(
      signedOut().upload.createUploadUrl({ contentType: "image/jpeg", contentLength: 2048 }),
    );
    expect(error.code).toBe("UNAUTHORIZED");
  });
});

describe("upload.limits", () => {
  test("tells the app the caps and the accepted content types", async () => {
    const limits = await signedIn().upload.limits();
    expect(limits.maxBytes.photo).toBe(10485760);
    expect(limits.maxBytes.video).toBe(104857600);
    expect(limits.contentTypes).toContain("image/jpeg");
    expect(limits.contentTypes).toContain("video/quicktime");
    expect(limits.contentTypes).not.toContain("application/pdf");
  });

  test("requires a session", async () => {
    const error = await errorOf(signedOut().upload.limits());
    expect(error.code).toBe("UNAUTHORIZED");
  });
});
