import { createId } from "@paralleldrive/cuid2";

/** Content types we let clients push into the bucket, with the extension we store them under. */
const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
} as const;

const videoTypes = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
} as const;

export const uploadContentTypes = { ...imageTypes, ...videoTypes };

export type UploadContentType = keyof typeof uploadContentTypes;

export const uploadKinds = ["photo", "video"] as const;
export type UploadKind = (typeof uploadKinds)[number];

/** Per-kind ceiling for a single upload, in bytes. */
export const maxUploadBytes: Record<UploadKind, number> = {
  photo: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

export function isUploadContentType(value: string): value is UploadContentType {
  // `hasOwn`, not `in`: `in` would happily accept "constructor" and friends.
  return Object.hasOwn(uploadContentTypes, value);
}

export function kindOfContentType(contentType: UploadContentType): UploadKind {
  return Object.hasOwn(imageTypes, contentType) ? "photo" : "video";
}

export function extensionOfContentType(contentType: UploadContentType): string {
  return uploadContentTypes[contentType];
}

/**
 * Object key for a proof upload. The user id keeps one person's uploads together,
 * and the cuid2 makes the key unguessable so a public bucket does not leak a
 * browsable listing of everyone's photos.
 */
export function buildMediaKey(userId: string, contentType: UploadContentType): string {
  return `posts/${userId}/${createId()}.${extensionOfContentType(contentType)}`;
}
