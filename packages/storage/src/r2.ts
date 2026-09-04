import { env } from "@doo/env/server";
import { AwsClient } from "aws4fetch";

import {
  buildMediaKey,
  kindOfContentType,
  maxUploadBytes,
  type UploadContentType,
} from "./media";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** No trailing slash. */
  publicBaseUrl: string;
};

/** Presigned URLs are short-lived: the app uploads right after asking for one. */
export const uploadUrlTtlSeconds = 300;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Cloudflare R2 is not configured");
    this.name = "StorageNotConfiguredError";
  }
}

export class UploadTooLargeError extends Error {
  constructor(readonly limitBytes: number) {
    super(`File is too large (max ${Math.floor(limitBytes / 1024 / 1024)}MB)`);
    this.name = "UploadTooLargeError";
  }
}

export function resolveR2Config(): R2Config | null {
  const {
    R2_ACCOUNT_ID: accountId,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
    R2_BUCKET: bucket,
    R2_PUBLIC_BASE_URL: publicBaseUrl,
  } = env;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
  };
}

export function isStorageConfigured(): boolean {
  return resolveR2Config() !== null;
}

export function objectUrl(config: R2Config, key: string): string {
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
}

export function publicUrl(config: R2Config, key: string): string {
  return `${config.publicBaseUrl}/${key}`;
}

export type CreateUploadUrlInput = {
  userId: string;
  contentType: UploadContentType;
  /** Size the client says it will send, used to reject oversized files up front. */
  contentLength: number;
};

export type CreateUploadUrlResult = {
  key: string;
  /** PUT the bytes here with the same `Content-Type`. */
  uploadUrl: string;
  /** Where the object is readable once the PUT succeeds — this is what we store. */
  publicUrl: string;
  expiresInSeconds: number;
};

/**
 * Hand the client a short-lived presigned PUT so the bytes go straight to R2
 * instead of through the API server.
 *
 * `Content-Type` is part of the signature, so a client cannot upload a file
 * under a type we did not approve.
 */
export async function createUploadUrl(
  input: CreateUploadUrlInput,
  config: R2Config | null = resolveR2Config(),
): Promise<CreateUploadUrlResult> {
  if (!config) throw new StorageNotConfiguredError();

  const limit = maxUploadBytes[kindOfContentType(input.contentType)];
  if (input.contentLength > limit) throw new UploadTooLargeError(limit);

  const key = buildMediaKey(input.userId, input.contentType);

  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const signed = await client.sign(
    `${objectUrl(config, key)}?X-Amz-Expires=${uploadUrlTtlSeconds}`,
    {
      method: "PUT",
      headers: { "content-type": input.contentType },
      // `allHeaders` is what pulls content-type into the signature —
      // aws4fetch leaves it unsigned by default.
      aws: { signQuery: true, allHeaders: true },
    },
  );

  return {
    key,
    uploadUrl: signed.url,
    publicUrl: publicUrl(config, key),
    expiresInSeconds: uploadUrlTtlSeconds,
  };
}
