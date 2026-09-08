import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Spinner, useThemeColor, useToast } from "heroui-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ig/avatar";
import { EmptyState } from "@/components/ig/empty-state";
import { PostGrid } from "@/components/ig/post-grid";
import { ProfileStats } from "@/components/ig/profile-stats";
import { MediaUploadField } from "@/components/media-upload-field";
import { formatWhen } from "@/components/post-card";
import { TagChips } from "@/components/tag-chips";
import { UserPicker } from "@/components/user-picker";
import { queryClient, trpc } from "@/utils/trpc";

type MediaType = "photo" | "video" | "text";

const mediaOptions: { value: MediaType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "text", label: "テキスト", icon: "text" },
  { value: "photo", label: "写真", icon: "image-outline" },
  { value: "video", label: "動画", icon: "videocam-outline" },
];

/** 一緒に達成した人として選べる人数。自分は含めない。 */
const MAX_COMPANIONS = 19;

export default function MissionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const { toast } = useToast();
  const foreground = useThemeColor("foreground");
  const placeholder = useThemeColor("muted");

  const [mediaType, setMediaType] = useState<MediaType>("text");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [companionIds, setCompanionIds] = useState<string[]>([]);
  const [isPickingCompanions, setIsPickingCompanions] = useState(false);

  const detail = useQuery(trpc.mission.get.queryOptions({ missionId }));

  function resetComposer() {
    setMediaUrl(null);
    setCaption("");
    setCompanionIds([]);
    setIsPickingCompanions(false);
  }

  const complete = useMutation(
    trpc.mission.complete.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries();
        resetComposer();
        toast.show({
          variant: "success",
          label: result.isShared ? "共同達成として記録しました" : "達成を記録しました",
        });
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  const postProgress = useMutation(
    trpc.mission.postProgress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        resetComposer();
        toast.show({ variant: "success", label: "進捗を投稿しました" });
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  const join = useMutation(
    trpc.mission.join.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.show({ variant: "success", label: "参加しました" });
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  const leave = useMutation(
    trpc.mission.leave.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.show({ variant: "success", label: "抜けました" });
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  const remove = useMutation(
    trpc.mission.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.show({ variant: "success", label: "やりたいことを削除しました" });
        router.back();
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  if (detail.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  const mission = detail.data;

  if (!mission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <EmptyState
          icon="alert-circle-outline"
          title="このやりたいことは見つかりません"
          body="すでに削除された可能性があります。"
        />
      </View>
    );
  }

  const needsMedia = mediaType !== "text";
  const isPosting = complete.isPending || postProgress.isPending;
  const canPost =
    !isPosting && (!needsMedia || mediaUrl !== null) && (needsMedia || caption.trim().length > 0);

  const media = {
    mediaType,
    mediaUrl: needsMedia ? (mediaUrl ?? undefined) : undefined,
    caption: caption.trim() || undefined,
  };

  function confirmRemove() {
    Alert.alert("やりたいことを削除しますか？", "達成の記録も一緒に消えます。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => remove.mutate({ missionId }),
      },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* プロフィールと同じ形のヘッダー。アイコン・数字・説明・ハッシュタグ */}
      <View className="flex-row items-center px-4 pt-4 pb-3 gap-6">
        <View className="w-[88px] h-[88px] rounded-full bg-surface-tertiary items-center justify-center">
          <Ionicons name="flag" size={38} color="#8e8e8e" />
        </View>
        <ProfileStats
          stats={[
            { label: "達成", value: mission.completions.length },
            { label: "参加", value: mission.participants.length },
          ]}
        />
      </View>

      <View className="px-4 pb-3 gap-0.5">
        <Text className="text-foreground text-[15px] font-semibold">{mission.title}</Text>
        {mission.description ? (
          <Text className="text-foreground text-[13px]" style={{ lineHeight: 18 }}>
            {mission.description}
          </Text>
        ) : null}
        <TagChips tags={mission.tags} />
        <Text className="text-muted text-[12px] mt-0.5">
          {mission.creatorName} が登録・{formatWhen(mission.createdAt)}
        </Text>
      </View>

      {/* 参加ボタン。Instagram のフォローボタンと同じ位置と形 */}
      <View className="flex-row px-4 pb-4 gap-1.5">
        {mission.isParticipant ? (
          mission.isCreator ? (
            <ActionButton label="削除する" onPress={confirmRemove} tone="danger" />
          ) : (
            <ActionButton
              label="抜ける"
              onPress={() => leave.mutate({ missionId })}
              isDisabled={leave.isPending}
            />
          )
        ) : (
          <ActionButton
            label="参加する"
            tone="accent"
            onPress={() => join.mutate({ missionId })}
            isDisabled={join.isPending}
          />
        )}
        <ActionButton
          label="参加者を見る"
          onPress={() =>
            Alert.alert(
              `参加している人（${mission.participants.length}人）`,
              mission.participants
                .map(
                  (participant) =>
                    `${participant.name}${
                      participant.userId === mission.creatorId ? "（登録した人）" : ""
                    }`,
                )
                .join("\n"),
            )
          }
        />
      </View>

      {mission.isCreator ? (
        <Text className="text-muted text-[12px] px-4 pb-3">
          登録した人は抜けられません。やめるときはやりたいことごと削除します。
        </Text>
      ) : null}
      {!mission.isCreator && mission.isParticipant && mission.myCompletionCount > 0 ? (
        <Text className="text-muted text-[12px] px-4 pb-3">
          自分の達成があるので抜けられません。
        </Text>
      ) : null}

      {/* 参加している人のアバターを、ストーリーのように横に並べる */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14, gap: 14 }}
      >
        {mission.participants.map((participant) => (
          <Pressable
            key={participant.userId}
            className="items-center gap-1.5 active:opacity-60"
            onPress={() =>
              router.push({
                pathname: "/user/[userId]",
                params: { userId: participant.userId },
              })
            }
          >
            <Avatar
              name={participant.name}
              size={60}
              hasRing={participant.userId === mission.creatorId}
            />
            <Text
              className="text-foreground text-[11px]"
              numberOfLines={1}
              style={{ maxWidth: 60 }}
            >
              {participant.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {mission.isParticipant ? (
        <View className="border-t border-border">
          <View className="px-4 py-3 flex-row items-center gap-2">
            <Text className="text-foreground text-[14px] font-semibold flex-1">投稿する</Text>
            {mediaOptions.map((option) => {
              const isActive = mediaType === option.value;
              return (
                <Pressable
                  key={option.value}
                  className="px-2 py-1 active:opacity-60"
                  onPress={() => {
                    // 選び直したら、前の種類でアップロードしたファイルは捨てる。
                    if (option.value !== mediaType) setMediaUrl(null);
                    setMediaType(option.value);
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={isActive ? "#0095f6" : "#8e8e8e"}
                  />
                </Pressable>
              );
            })}
          </View>

          {needsMedia ? (
            <View className="px-4 pb-3">
              <MediaUploadField
                key={mediaType}
                kind={mediaType === "photo" ? "photo" : "video"}
                value={mediaUrl}
                onChange={setMediaUrl}
              />
            </View>
          ) : null}

          <View className="px-4 pb-3">
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="どうやって達成した？"
              placeholderTextColor={placeholder}
              multiline
              maxLength={500}
              className="text-foreground text-[15px]"
              style={{ color: foreground, minHeight: 64, textAlignVertical: "top" }}
            />
          </View>

          <View className="h-[0.5px] bg-border mx-4" />

          <Pressable
            className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-60"
            onPress={() => setIsPickingCompanions((value) => !value)}
          >
            <Ionicons name="person-add-outline" size={20} color={foreground} />
            <Text className="text-foreground text-[15px] flex-1">一緒に達成した人</Text>
            <Text className="text-muted text-[14px]">
              {companionIds.length ? `${companionIds.length}人` : ""}
            </Text>
            <Ionicons
              name={isPickingCompanions ? "chevron-up" : "chevron-forward"}
              size={16}
              color="#8e8e8e"
            />
          </Pressable>

          {isPickingCompanions ? (
            <View className="px-4 pb-3">
              <UserPicker
                selectedIds={companionIds}
                onChange={setCompanionIds}
                max={MAX_COMPANIONS}
              />
            </View>
          ) : null}

          <View className="h-[0.5px] bg-border mx-4" />

          <View className="px-4 pt-4 gap-2">
            <ActionButton
              label="達成として投稿する"
              tone="accent"
              isDisabled={!canPost}
              isPending={complete.isPending}
              onPress={() =>
                complete.mutate({ missionId, participantIds: companionIds, ...media })
              }
            />
            <ActionButton
              label="進捗として投稿する"
              isDisabled={!canPost}
              isPending={postProgress.isPending}
              onPress={() => postProgress.mutate({ missionId, ...media })}
            />
          </View>
        </View>
      ) : null}

      <View className="mt-5 border-t border-border">
        {mission.completions.length ? (
          <PostGrid
            items={mission.completions.map((completion) => ({
              ...completion,
              missionId,
              missionTitle: mission.title,
            }))}
          />
        ) : (
          <EmptyState
            icon="trophy-outline"
            title="まだ達成はありません"
            body="最初の一件を投稿してみよう。"
          />
        )}
      </View>
    </ScrollView>
  );
}

/** Instagram のフォロー・フォロー中ボタンと同じ形のボタン。 */
function ActionButton({
  label,
  onPress,
  tone = "default",
  isDisabled,
  isPending,
}: {
  label: string;
  onPress: () => void;
  tone?: "default" | "accent" | "danger";
  isDisabled?: boolean;
  isPending?: boolean;
}) {
  const background =
    tone === "accent" ? "#0095f6" : tone === "danger" ? "#ed4956" : undefined;

  return (
    <Pressable
      onPress={isDisabled || isPending ? undefined : onPress}
      className={`flex-1 items-center justify-center rounded-lg py-2.5 active:opacity-80 ${
        background ? "" : "bg-surface-tertiary"
      }`}
      style={[
        background ? { backgroundColor: background } : undefined,
        isDisabled ? { opacity: 0.4 } : undefined,
      ]}
    >
      {isPending ? (
        <Spinner size="sm" color="default" />
      ) : (
        <Text
          className={`text-[14px] font-semibold ${background ? "text-white" : "text-foreground"}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
