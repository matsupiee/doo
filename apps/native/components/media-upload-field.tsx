import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "heroui-native";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import {
  captureWithCamera,
  pickFromLibrary,
  putToPresignedUrl,
  type PickedMedia,
  type UploadKind,
} from "@/utils/media-upload";
import { trpc } from "@/utils/trpc";

type Props = {
  kind: UploadKind;
  /** Public R2 URL of the uploaded file, or null while nothing is attached. */
  value: string | null;
  onChange: (url: string | null) => void;
};

/**
 * Pick a photo or video, push it to Cloudflare R2 with a presigned PUT, and
 * hand the resulting public URL back to the form.
 */
export function MediaUploadField({ kind, value, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createUploadUrl = useMutation(trpc.upload.createUploadUrl.mutationOptions());
  const [isUploading, setIsUploading] = useState(false);

  async function handle(pick: () => Promise<PickedMedia | null>) {
    setError(null);
    try {
      const media = await pick();
      if (!media) return;

      setIsUploading(true);
      setPreview(media.uri);
      const target = await createUploadUrl.mutateAsync({
        contentType: media.contentType,
        contentLength: media.size,
      });
      await putToPresignedUrl(media, target.uploadUrl);
      onChange(target.publicUrl);
    } catch (cause) {
      setPreview(null);
      onChange(null);
      setError(cause instanceof Error ? cause.message : "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  }

  const label = kind === "photo" ? "写真" : "動画";

  return (
    <View className="gap-2">
      {/* Instagram の投稿と同じ正方形のプレビュー */}
      <View className="w-full aspect-square bg-surface-tertiary items-center justify-center overflow-hidden">
        {preview && kind === "photo" ? (
          <Image source={{ uri: preview }} className="w-full h-full" resizeMode="cover" />
        ) : preview ? (
          <View className="items-center gap-2">
            <Ionicons name="videocam" size={40} color="#8e8e8e" />
            <Text className="text-muted text-[12px]">動画を選択しました</Text>
          </View>
        ) : (
          <View className="items-center gap-2">
            <Ionicons
              name={kind === "photo" ? "images-outline" : "videocam-outline"}
              size={40}
              color="#8e8e8e"
            />
            <Text className="text-muted text-[12px]">
              {label}を選ぶと、ここにプレビューが出ます
            </Text>
          </View>
        )}

        {isUploading ? (
          <View className="absolute inset-0 items-center justify-center bg-black/40 gap-2">
            <Spinner />
            <Text className="text-white text-[12px]">{label}をアップロード中…</Text>
          </View>
        ) : null}
      </View>

      {/* Instagram のギャラリー切り替えと同じ、青い文字のふたつの操作 */}
      <View className="flex-row items-center justify-center gap-8 py-1">
        <Pressable
          className="flex-row items-center gap-1.5 active:opacity-60"
          disabled={isUploading}
          onPress={() => handle(() => pickFromLibrary(kind))}
        >
          <Ionicons name="images-outline" size={18} color="#0095f6" />
          <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
            ライブラリ
          </Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-1.5 active:opacity-60"
          disabled={isUploading}
          onPress={() => handle(() => captureWithCamera(kind))}
        >
          <Ionicons name="camera-outline" size={18} color="#0095f6" />
          <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
            {kind === "photo" ? "撮影する" : "録画する"}
          </Text>
        </Pressable>
      </View>

      {!isUploading && value ? (
        <Text className="text-[12px] text-center" style={{ color: "#0095f6" }}>
          {label}をアップロードしました
        </Text>
      ) : null}

      {!isUploading && !value ? (
        <Text className="text-muted text-[12px] text-center">
          {kind === "photo" ? "最大 10MB" : "最大 100MB"}まで。アップロードした{label}
          が達成の証拠になります。
        </Text>
      ) : null}

      {error ? <Text className="text-danger text-[12px] text-center">{error}</Text> : null}
    </View>
  );
}
