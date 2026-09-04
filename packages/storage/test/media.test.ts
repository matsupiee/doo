import { describe, expect, test } from "bun:test";

import {
  buildMediaKey,
  extensionOfContentType,
  isUploadContentType,
  kindOfContentType,
  maxUploadBytes,
} from "../src/media";

describe("isUploadContentType", () => {
  test("accepts the image and video types the app can send", () => {
    for (const type of [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ]) {
      expect(isUploadContentType(type)).toBe(true);
    }
  });

  test("rejects anything else, including things that merely look like media", () => {
    for (const type of [
      "application/pdf",
      "text/html",
      "image/svg+xml",
      "image/jpeg; charset=utf-8",
      "IMAGE/JPEG",
      "",
      "constructor",
    ]) {
      expect(isUploadContentType(type)).toBe(false);
    }
  });
});

describe("kindOfContentType", () => {
  test("splits images from videos", () => {
    expect(kindOfContentType("image/heic")).toBe("photo");
    expect(kindOfContentType("image/gif")).toBe("photo");
    expect(kindOfContentType("video/quicktime")).toBe("video");
  });
});

describe("extensionOfContentType", () => {
  test("maps to the extension we store the object under", () => {
    expect(extensionOfContentType("image/jpeg")).toBe("jpg");
    expect(extensionOfContentType("video/quicktime")).toBe("mov");
    expect(extensionOfContentType("image/png")).toBe("png");
  });
});

describe("maxUploadBytes", () => {
  test("caps photos at 10MB and videos at 100MB", () => {
    expect(maxUploadBytes.photo).toBe(10485760);
    expect(maxUploadBytes.video).toBe(104857600);
  });
});

describe("buildMediaKey", () => {
  test("namespaces by user and ends with the content type's extension", () => {
    const key = buildMediaKey("user_123", "image/jpeg");
    expect(key).toMatch(/^posts\/user_123\/[a-z0-9]+\.jpg$/);
  });

  test("is unguessable — two keys for the same user never collide", () => {
    const keys = new Set(
      Array.from({ length: 100 }, () => buildMediaKey("user_123", "image/png")),
    );
    expect(keys.size).toBe(100);
  });
});
