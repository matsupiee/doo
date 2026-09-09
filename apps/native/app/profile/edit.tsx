import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { Spinner, useThemeColor, useToast } from "heroui-native";
import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ig/avatar";
import {
  captureWithCamera,
  pickFromLibrary,
  putToPresignedUrl,
  type PickedMedia,
} from "@/utils/media-upload";
import { queryClient, trpc } from "@/utils/trpc";

const MAX_NAME = 40;
const MAX_BIO = 200;

/** Instagram のプロフィール編集。アイコン・名前・自己紹介だけを扱う。 */
export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const foreground = useThemeColor("foreground");
  const placeholder = useThemeColor("muted");

  const me = useQuery(trpc.user.me.queryOptions());

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);
  /** アップロード中に出す、まだ公開 URL になっていない端末内の写真。 */
  const [pending, setPending] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  /** 読み込みが終わった一度だけ、サーバーの値をフォームに入れる。 */
  const [isLoaded, setIsLoaded] = useState(false);

  const createUploadUrl = useMutation(trpc.upload.createUploadUrl.mutationOptions());

  const updateProfile = useMutation(
    trpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.show({ variant: "success", label: "プロフィールを更新しました" });
        router.back();
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  useEffect(() => {
    if (isLoaded || !me.data) return;
    setName(me.data.name);
    setBio(me.data.bio ?? "");
    setImage(me.data.image);
    setIsLoaded(true);
  }, [isLoaded, me.data]);

  async function upload(pick: () => Promise<PickedMedia | null>) {
    try {
      const media = await pick();
      if (!media) return;

      setIsUploading(true);
      setPending(media.uri);
      const target = await createUploadUrl.mutateAsync({
        contentType: media.contentType,
        contentLength: media.size,
      });
      await putToPresignedUrl(media, target.uploadUrl);
      setImage(target.publicUrl);
    } catch (cause) {
      setPending(null);
      toast.show({
        variant: "danger",
        label: cause instanceof Error ? cause.message : "アップロードに失敗しました",
      });
    } finally {
      setIsUploading(false);
    }
  }

  /** 「ライブラリ / 撮影する / 削除」を下から出す。 */
  function openImagePicker() {
    const canRemove = !!image || !!pending;
    const labels = ["ライブラリから選ぶ", "写真を撮る"];
    if (canRemove) labels.push("現在の写真を削除");

    const run = (index: number) => {
      if (index === 0) void upload(() => pickFromLibrary("photo"));
      else if (index === 1) void upload(() => captureWithCamera("photo"));
      else if (index === 2) {
        setImage(null);
        setPending(null);
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, "キャンセル"],
          cancelButtonIndex: labels.length,
          destructiveButtonIndex: canRemove ? 2 : undefined,
        },
        (index) => {
          if (index < labels.length) run(index);
        },
      );
      return;
    }

    // Android には ActionSheet がないので、ライブラリを直接開く。
    void upload(() => pickFromLibrary("photo"));
  }

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isUploading && !updateProfile.isPending;

  function save() {
    if (!canSubmit) return;
    updateProfile.mutate({
      name: trimmedName,
      bio: bio.trim() || null,
      image,
    });
  }

  if (me.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Instagram と同じく、保存はヘッダー右の「完了」に置く */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={save}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="完了"
              className="active:opacity-60"
              style={{ opacity: canSubmit ? 1 : 0.4 }}
            >
              {updateProfile.isPending ? (
                <Spinner size="sm" />
              ) : (
                <Text className="text-[15px] font-semibold" style={{ color: "#0095f6" }}>
                  完了
                </Text>
              )}
            </Pressable>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* アイコンとその下の文字で、ひとつの押せる範囲にする */}
        <Pressable
          onPress={openImagePicker}
          disabled={isUploading}
          accessibilityRole="button"
          accessibilityLabel="プロフィール写真を変更"
          className="items-center gap-2 py-6 active:opacity-70"
        >
          <View>
            <Avatar name={name} uri={pending ?? image} size={96} />
            {isUploading ? (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                <Spinner size="sm" color="default" />
              </View>
            ) : null}
          </View>
          <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
            {isUploading ? "アップロード中…" : "プロフィール写真を変更"}
          </Text>
        </Pressable>

        <View className="h-[0.5px] bg-border" />

        <FieldRow label="名前">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="名前"
            placeholderTextColor={placeholder}
            maxLength={MAX_NAME}
            className="text-[15px]"
            style={{ color: foreground }}
          />
        </FieldRow>

        <FieldRow label="自己紹介">
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="自己紹介を書く…"
            placeholderTextColor={placeholder}
            maxLength={MAX_BIO}
            multiline
            className="text-[15px]"
            style={{ color: foreground, minHeight: 72, textAlignVertical: "top" }}
          />
          <Text className="text-muted text-[12px] self-end">
            {bio.length} / {MAX_BIO}
          </Text>
        </FieldRow>

        <View className="flex-row gap-2 px-4 py-3.5">
          <Ionicons name="earth-outline" size={18} color="#8e8e8e" />
          <Text className="text-muted text-[12px] flex-1" style={{ lineHeight: 17 }}>
            アイコン・名前・自己紹介は、ほかのユーザーからも見えます。
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/** ラベルを左に置かず、上に小さく出す Instagram の編集行。 */
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <View className="px-4 py-3 gap-1.5">
        <Text className="text-muted text-[12px]">{label}</Text>
        {children}
      </View>
      <View className="h-[0.5px] bg-border mx-4" />
    </View>
  );
}
