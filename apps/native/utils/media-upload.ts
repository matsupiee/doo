import { getInfoAsync, FileSystemUploadType, uploadAsync } from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

export type UploadKind = "photo" | "video";

export type PickedMedia = {
  uri: string;
  contentType: string;
  size: number;
  kind: UploadKind;
};

/** Content types the API accepts (mirrors `@doo/storage`'s allow-list). */
const extensionToContentType: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

function contentTypeOf(asset: ImagePicker.ImagePickerAsset, kind: UploadKind): string {
  // The picker usually knows; strip any "; charset=..." because the API's
  // allow-list only matches bare types.
  if (asset.mimeType) return asset.mimeType.split(";")[0]!.trim().toLowerCase();

  const extension = extensionOf(asset.fileName ?? asset.uri);
  return extensionToContentType[extension] ?? (kind === "photo" ? "image/jpeg" : "video/mp4");
}

function extensionOf(value: string): string {
  return value.split("?")[0]!.split(".").pop()?.toLowerCase() ?? "";
}

async function sizeOf(asset: ImagePicker.ImagePickerAsset): Promise<number> {
  if (asset.fileSize && asset.fileSize > 0) return asset.fileSize;
  const info = await getInfoAsync(asset.uri);
  return info.exists ? info.size : 0;
}

async function toPickedMedia(
  asset: ImagePicker.ImagePickerAsset,
  kind: UploadKind,
): Promise<PickedMedia> {
  return {
    uri: asset.uri,
    contentType: contentTypeOf(asset, kind),
    size: await sizeOf(asset),
    kind,
  };
}

/** Returns null when the user backs out or denies the permission prompt. */
export async function pickFromLibrary(kind: UploadKind): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("写真へのアクセスが許可されていません");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === "photo" ? ["images"] : ["videos"],
    quality: 0.8,
    allowsMultipleSelection: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toPickedMedia(asset, kind) : null;
}

export async function captureWithCamera(kind: UploadKind): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error("カメラへのアクセスが許可されていません");

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: kind === "photo" ? ["images"] : ["videos"],
    quality: 0.8,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toPickedMedia(asset, kind) : null;
}

/**
 * Streams the file straight to R2 with the presigned PUT the API handed us.
 * `Content-Type` has to match the one we asked to sign, or R2 rejects it.
 */
export async function putToPresignedUrl(media: PickedMedia, uploadUrl: string): Promise<void> {
  const response = await uploadAsync(uploadUrl, media.uri, {
    httpMethod: "PUT",
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": media.contentType },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`アップロードに失敗しました (${response.status})`);
  }
}
