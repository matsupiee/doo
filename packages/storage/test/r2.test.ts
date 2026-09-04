import { describe, expect, test } from "bun:test";

import {
  createUploadUrl,
  isStorageConfigured,
  publicUrl,
  type R2Config,
  resolveR2Config,
  StorageNotConfiguredError,
  UploadTooLargeError,
} from "../src/r2";

const config: R2Config = {
  accountId: "test-account",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  bucket: "doo-media-test",
  publicBaseUrl: "https://media.example.com",
};

describe("resolveR2Config", () => {
  test("reads the env the test setup provides and trims the trailing slash", () => {
    const resolved = resolveR2Config();
    expect(resolved).not.toBeNull();
    expect(resolved?.bucket).toBe("doo-media-test");
    expect(resolved?.publicBaseUrl).toBe("https://media.example.com");
    expect(isStorageConfigured()).toBe(true);
  });
});

describe("publicUrl", () => {
  test("joins the public base URL and the key with exactly one slash", () => {
    expect(publicUrl(config, "posts/u1/abc.jpg")).toBe(
      "https://media.example.com/posts/u1/abc.jpg",
    );
  });
});

describe("createUploadUrl", () => {
  test("presigns a PUT against the bucket and returns the matching public URL", async () => {
    const result = await createUploadUrl(
      { userId: "user_1", contentType: "image/jpeg", contentLength: 1024 },
      config,
    );

    const url = new URL(result.uploadUrl);
    expect(url.origin).toBe("https://test-account.r2.cloudflarestorage.com");
    expect(url.pathname).toBe(`/doo-media-test/${result.key}`);
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.get("X-Amz-Credential")).toContain("test-access-key");
    expect(url.searchParams.get("X-Amz-Credential")).toContain("/auto/s3/aws4_request");

    expect(result.publicUrl).toBe(`https://media.example.com/${result.key}`);
    expect(result.expiresInSeconds).toBe(300);
  });

  test("signs Content-Type so a client cannot swap in a type we did not approve", async () => {
    const { uploadUrl } = await createUploadUrl(
      { userId: "user_1", contentType: "image/png", contentLength: 1024 },
      config,
    );
    const signedHeaders = new URL(uploadUrl).searchParams.get("X-Amz-SignedHeaders");
    expect(signedHeaders?.split(";")).toContain("content-type");
  });

  test("two calls produce different keys", async () => {
    const a = await createUploadUrl(
      { userId: "user_1", contentType: "image/jpeg", contentLength: 1 },
      config,
    );
    const b = await createUploadUrl(
      { userId: "user_1", contentType: "image/jpeg", contentLength: 1 },
      config,
    );
    expect(a.key).not.toBe(b.key);
  });

  test("accepts a photo right at the 10MB limit", async () => {
    const result = await createUploadUrl(
      { userId: "user_1", contentType: "image/jpeg", contentLength: 10485760 },
      config,
    );
    expect(result.key).toEndWith(".jpg");
  });

  test("rejects a photo one byte over the limit", async () => {
    const call = createUploadUrl(
      { userId: "user_1", contentType: "image/jpeg", contentLength: 10485761 },
      config,
    );
    await expect(call).rejects.toBeInstanceOf(UploadTooLargeError);
  });

  test("applies the larger video limit to videos", async () => {
    const ok = await createUploadUrl(
      { userId: "user_1", contentType: "video/mp4", contentLength: 104857600 },
      config,
    );
    expect(ok.key).toEndWith(".mp4");

    await expect(
      createUploadUrl(
        { userId: "user_1", contentType: "video/mp4", contentLength: 104857601 },
        config,
      ),
    ).rejects.toBeInstanceOf(UploadTooLargeError);
  });

  test("throws when R2 is not configured instead of signing with empty credentials", async () => {
    await expect(
      createUploadUrl(
        { userId: "user_1", contentType: "image/jpeg", contentLength: 1024 },
        null,
      ),
    ).rejects.toBeInstanceOf(StorageNotConfiguredError);
  });
});
