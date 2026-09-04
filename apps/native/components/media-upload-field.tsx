import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Image, Text, View } from "react-native";

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
  const mutedColor = useThemeColor("muted");

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
      {preview && kind === "photo" ? (
        <Image
          source={{ uri: preview }}
          className="w-full h-56 rounded-lg"
          resizeMode="cover"
        />
      ) : null}

      {preview && kind === "video" ? (
        <View className="h-24 items-center justify-center rounded-lg border border-border">
          <Ionicons name="videocam" size={28} color={mutedColor} />
          <Text className="text-muted text-xs mt-1">動画を選択しました</Text>
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <Button
          className="flex-1"
          variant="secondary"
          isDisabled={isUploading}
          onPress={() => handle(() => pickFromLibrary(kind))}
        >
          <Button.Label>ライブラリから選ぶ</Button.Label>
        </Button>
        <Button
          className="flex-1"
          variant="secondary"
          isDisabled={isUploading}
          onPress={() => handle(() => captureWithCamera(kind))}
        >
          <Button.Label>{kind === "photo" ? "撮影する" : "録画する"}</Button.Label>
        </Button>
      </View>

      {isUploading ? (
        <View className="flex-row items-center gap-2">
          <Spinner size="sm" />
          <Text className="text-muted text-sm">{label}をアップロード中…</Text>
        </View>
      ) : null}

      {!isUploading && value ? (
        <Text className="text-success text-sm">{label}をアップロードしました</Text>
      ) : null}

      {!isUploading && !value ? (
        <Text className="text-muted text-xs">
          {kind === "photo" ? "最大 10MB" : "最大 100MB"}まで。アップロードした{label}
          が達成の証拠になります。
        </Text>
      ) : null}

      {error ? <Text className="text-danger text-sm">{error}</Text> : null}
    </View>
  );
}
