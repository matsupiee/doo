import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Spinner, useThemeColor, useToast } from "heroui-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ig/avatar";
import { EmptyState } from "@/components/ig/empty-state";
import { PostGrid } from "@/components/ig/post-grid";
import { Sheet, SheetMenuItem } from "@/components/ig/sheet";
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
  const { missionId, compose } = useLocalSearchParams<{ missionId: string; compose?: string }>();
  const { toast } = useToast();
  const foreground = useThemeColor("foreground");
  const placeholder = useThemeColor("muted");

  const [mediaType, setMediaType] = useState<MediaType>("text");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [companionIds, setCompanionIds] = useState<string[]>([]);
  const [isPickingCompanions, setIsPickingCompanions] = useState(false);

  // 3点リーダーのメニュー・投稿シート・参加者一覧は、どれも下から出るシート。
  // ホームの ＋ から「達成」で来たときは、最初から投稿シートを開けておく。
  const [openSheet, setOpenSheet] = useState<"menu" | "composer" | "participants" | null>(
    compose === "1" ? "composer" : null,
  );

  const detail = useQuery(trpc.mission.get.queryOptions({ missionId }));

  function resetComposer() {
    setMediaType("text");
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
        setOpenSheet(null);
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
        setOpenSheet(null);
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

  function confirmLeave() {
    Alert.alert("このやりたいことから抜けますか？", undefined, [
      { text: "キャンセル", style: "cancel" },
      { text: "抜ける", style: "destructive", onPress: () => leave.mutate({ missionId }) },
    ]);
  }

  async function share() {
    if (!mission) return;
    const tags = mission.tags.map((tag) => `#${tag}`).join(" ");
    await Share.share({
      message: [`「${mission.title}」を doo でやっています。`, tags, `doo://mission/${missionId}`]
        .filter(Boolean)
        .join("\n"),
    });
  }

  // 3点リーダーで開くメニュー。作成者は削除、参加者は退出ができる。
  const canDelete = mission.isCreator;
  const canLeave = !mission.isCreator && mission.isParticipant;
  const hasMenu = canDelete || canLeave;

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* 削除・投稿・シェアはヘッダーのアイコンにまとめる */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              {hasMenu ? (
                <HeaderIcon
                  name="ellipsis-horizontal"
                  label="メニュー"
                  color={foreground}
                  onPress={() => setOpenSheet("menu")}
                />
              ) : null}
              {mission.isParticipant ? (
                <HeaderIcon
                  name="add"
                  label="投稿する"
                  size={26}
                  color={foreground}
                  onPress={() => setOpenSheet("composer")}
                />
              ) : null}
              <HeaderIcon
                name="paper-plane-outline"
                label="シェアする"
                color={foreground}
                onPress={share}
              />
            </View>
          ),
        }}
      />

      {/* プロフィールと同じ形のヘッダー。アイコンの右に見出しと数字 */}
      <View className="flex-row items-center px-4 pt-4 pb-3 gap-4">
        <View className="w-[88px] h-[88px] rounded-full bg-surface-tertiary items-center justify-center">
          <Ionicons name="flag" size={38} color="#8e8e8e" />
        </View>
        <View className="flex-1 gap-1.5">
          <Text className="text-foreground text-[18px] font-semibold" numberOfLines={3}>
            {mission.title}
          </Text>
          <View className="flex-row items-center gap-5">
            <Stat label="達成" value={mission.completions.length} />
            <Stat label="参加" value={mission.participants.length} />
          </View>
        </View>
      </View>

      <View className="px-4 pb-3 gap-0.5">
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
      {mission.isParticipant ? null : (
        <View className="flex-row px-4 pb-4">
          <ActionButton
            label="参加する"
            tone="accent"
            onPress={() => join.mutate({ missionId })}
            isDisabled={join.isPending}
          />
        </View>
      )}

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

      {/* 参加している人のアバターを、ストーリーのように横に並べる。右端から一覧を開ける */}
      <View className="flex-row items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="参加者を見る"
          className="pl-2 pr-4 pb-3.5 active:opacity-60"
          onPress={() => setOpenSheet("participants")}
        >
          <Ionicons name="chevron-forward" size={22} color="#8e8e8e" />
        </Pressable>
      </View>

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

      <Sheet isVisible={openSheet === "menu"} onClose={() => setOpenSheet(null)}>
        {canLeave ? (
          <SheetMenuItem
            label="抜ける"
            icon="exit-outline"
            onPress={() => {
              setOpenSheet(null);
              confirmLeave();
            }}
          />
        ) : null}
        {canDelete ? (
          <SheetMenuItem
            label="削除"
            icon="trash-outline"
            tone="danger"
            onPress={() => {
              setOpenSheet(null);
              confirmRemove();
            }}
          />
        ) : null}
      </Sheet>

      <Sheet
        isVisible={openSheet === "composer"}
        onClose={() => setOpenSheet(null)}
        title="達成を投稿する"
        isScrollable
      >
        <View className="px-4 py-3 flex-row items-center gap-2">
          <Text className="text-foreground text-[14px] font-semibold flex-1">投稿の種類</Text>
          {mediaOptions.map((option) => {
            const isActive = mediaType === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                className="px-2 py-1 active:opacity-60"
                onPress={() => {
                  // 選び直したら、前の種類でアップロードしたファイルは捨てる。
                  if (option.value !== mediaType) setMediaUrl(null);
                  setMediaType(option.value);
                }}
              >
                <Ionicons name={option.icon} size={22} color={isActive ? "#0095f6" : "#8e8e8e"} />
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
            onPress={() => complete.mutate({ missionId, participantIds: companionIds, ...media })}
          />
          <ActionButton
            label="進捗として投稿する"
            isDisabled={!canPost}
            isPending={postProgress.isPending}
            onPress={() => postProgress.mutate({ missionId, ...media })}
          />
        </View>
      </Sheet>

      <Sheet
        isVisible={openSheet === "participants"}
        onClose={() => setOpenSheet(null)}
        title={`参加している人（${mission.participants.length}人）`}
        isScrollable
      >
        {mission.participants.map((participant) => (
          <Pressable
            key={participant.userId}
            className="flex-row items-center gap-3 px-4 py-3 active:opacity-60"
            onPress={() => {
              setOpenSheet(null);
              router.push({
                pathname: "/user/[userId]",
                params: { userId: participant.userId },
              });
            }}
          >
            <Avatar
              name={participant.name}
              size={44}
              hasRing={participant.userId === mission.creatorId}
            />
            <Text className="text-foreground text-[15px] flex-1" numberOfLines={1}>
              {participant.name}
            </Text>
            {participant.userId === mission.creatorId ? (
              <Text className="text-muted text-[12px]">登録した人</Text>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color="#8e8e8e" />
          </Pressable>
        ))}
      </Sheet>
    </ScrollView>
  );
}

/** アイコンの下に数字、その下にラベルではなく、見出しの下に横並びで置く小さな数字。 */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-baseline gap-1">
      <Text className="text-foreground text-[15px] font-bold">{value}</Text>
      <Text className="text-muted text-[13px]">{label}</Text>
    </View>
  );
}

/** ヘッダーに並ぶアイコンボタン。 */
function HeaderIcon({
  name,
  label,
  color,
  size = 22,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  size?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="active:opacity-60"
      onPress={onPress}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
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
  const background = tone === "accent" ? "#0095f6" : tone === "danger" ? "#ed4956" : undefined;

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
