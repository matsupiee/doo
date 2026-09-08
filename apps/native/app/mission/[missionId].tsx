import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Input, Label, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MediaUploadField } from "@/components/media-upload-field";
import { formatWhen } from "@/components/post-card";
import { TagChips } from "@/components/tag-chips";
import { ActionButton } from "@/components/ui/action-button";
import { Panel, PanelEyebrow, PanelMutedText, PanelText, PanelTitle } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatTile } from "@/components/ui/stat-tile";
import { toneForKey } from "@/components/ui/theme";
import { useAppTheme } from "@/contexts/app-theme-context";
import { UserPicker } from "@/components/user-picker";
import { queryClient, trpc } from "@/utils/trpc";

type MediaType = "photo" | "video" | "text";

const mediaOptions: { value: MediaType; label: string }[] = [
  { value: "photo", label: "写真" },
  { value: "video", label: "動画" },
  { value: "text", label: "テキスト" },
];

/** 一緒に達成した人として選べる人数。自分は含めない。 */
const MAX_COMPANIONS = 19;

export default function MissionDetailScreen() {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

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
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <ScreenHeader title="やりたいこと" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-foreground font-semibold">このやりたいことは見つかりません</Text>
          <Text className="text-muted text-sm">すでに削除された可能性があります。</Text>
        </View>
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

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="やりたいこと" eyebrow="MISSION" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      >
        <Panel tone={toneForKey(mission.missionId, isDark)} className="p-5 gap-3">
          <View className="gap-1">
            <PanelEyebrow>MISSION</PanelEyebrow>
            <PanelTitle size={30}>{mission.title}</PanelTitle>
          </View>
          {mission.description ? <PanelText>{mission.description}</PanelText> : null}
          <TagChips tags={mission.tags} />
          <PanelMutedText>
            登録: {mission.creatorName}・{formatWhen(mission.createdAt)}
          </PanelMutedText>
        </Panel>

        <View className="flex-row gap-2">
          <StatTile label="参加" value={mission.participants.length} tone={isDark ? "cream" : "ink"} />
          <StatTile label="達成" value={mission.completions.length} tone={isDark ? "cream" : "ink"} />
        </View>

        <Panel className="p-4 gap-3">
          <PanelTitle size={18}>
            参加している人（{mission.participants.length}人）
          </PanelTitle>

          <View className="flex-row flex-wrap gap-2">
            {mission.participants.map((participant) => (
              <Pill
                key={participant.userId}
                size="sm"
                label={`${participant.name}${
                  participant.userId === mission.creatorId ? "（登録した人）" : ""
                }`}
              />
            ))}
          </View>

          {mission.isParticipant ? (
            <View className="flex-row">
              {mission.isCreator ? (
                <ActionButton
                  label="やりたいことを削除する"
                  size="sm"
                  tone="coral"
                  isPending={remove.isPending}
                  onPress={() => remove.mutate({ missionId })}
                />
              ) : (
                <ActionButton
                  label="抜ける"
                  size="sm"
                  variant="outline"
                  isPending={leave.isPending}
                  onPress={() => leave.mutate({ missionId })}
                />
              )}
            </View>
          ) : (
            <ActionButton
              label="参加する"
              tone="violet"
              hasArrow
              isPending={join.isPending}
              onPress={() => join.mutate({ missionId })}
            />
          )}

          {mission.isCreator ? (
            <PanelMutedText>
              登録した人は抜けられません。やめるときはやりたいことごと削除します。
            </PanelMutedText>
          ) : null}
          {!mission.isCreator && mission.isParticipant && mission.myCompletionCount > 0 ? (
            <PanelMutedText>自分の達成があるので抜けられません。</PanelMutedText>
          ) : null}
        </Panel>

        {mission.isParticipant ? (
          <Panel className="p-4 gap-3">
            <PanelTitle size={18}>達成・進捗を投稿する</PanelTitle>

            <View className="flex-row gap-2">
              {mediaOptions.map((option) => (
                <Pill
                  key={option.value}
                  label={option.label}
                  isSelected={mediaType === option.value}
                  onPress={() => {
                    // The uploaded file belongs to the previous kind — drop it.
                    if (option.value !== mediaType) setMediaUrl(null);
                    setMediaType(option.value);
                  }}
                />
              ))}
            </View>

            {needsMedia ? (
              <MediaUploadField
                key={mediaType}
                kind={mediaType === "photo" ? "photo" : "video"}
                value={mediaUrl}
                onChange={setMediaUrl}
              />
            ) : null}

            <TextField>
              <Label>ひとこと{needsMedia ? "（任意）" : ""}</Label>
              <Input
                value={caption}
                onChangeText={setCaption}
                placeholder="どうやって達成した？"
                multiline
                numberOfLines={3}
                maxLength={500}
                style={{ minHeight: 72, textAlignVertical: "top" }}
              />
            </TextField>

            <View className="gap-2">
              <PanelText style={{ fontWeight: "700" }}>
                一緒に達成した人（{companionIds.length}人）
              </PanelText>
              <PanelMutedText>
                選ぶと共同達成になります。参加していない人を選ぶと、その場で参加者になります。
              </PanelMutedText>

              {isPickingCompanions ? (
                <UserPicker selectedIds={companionIds} onChange={setCompanionIds} max={MAX_COMPANIONS} />
              ) : null}

              <View className="flex-row">
                <ActionButton
                  label={isPickingCompanions ? "選び終わった" : "一緒に達成した人を選ぶ"}
                  size="sm"
                  variant="outline"
                  onPress={() => setIsPickingCompanions((value) => !value)}
                />
              </View>
            </View>

            <ActionButton
              label="達成として投稿する"
              tone="coral"
              hasArrow
              isDisabled={!canPost}
              isPending={complete.isPending}
              onPress={() => complete.mutate({ missionId, participantIds: companionIds, ...media })}
            />

            <ActionButton
              label="進捗として投稿する"
              tone="yellow"
              isDisabled={!canPost}
              isPending={postProgress.isPending}
              onPress={() => postProgress.mutate({ missionId, ...media })}
            />
          </Panel>
        ) : null}

        <Text
          className="text-foreground"
          style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}
        >
          達成（{mission.completions.length}件）
        </Text>

        {mission.completions.length === 0 ? (
          <Panel className="p-4">
            <PanelMutedText>まだ達成はありません。</PanelMutedText>
          </Panel>
        ) : null}

        {mission.completions.map((completion) => (
          <Panel key={completion.completionId} tone={isDark ? "cream" : "ink"} className="p-4 gap-1">
            <PanelEyebrow>COMPLETED</PanelEyebrow>
            <PanelTitle size={17}>
              {completion.participants.map((row) => row.name).join("・")}
              {completion.participants.length > 1 ? " が共同で達成" : " が達成"}
            </PanelTitle>
            <PanelMutedText>{formatWhen(completion.completedAt)}</PanelMutedText>
            {completion.caption ? (
              <PanelText style={{ marginTop: 4 }}>{completion.caption}</PanelText>
            ) : null}
          </Panel>
        ))}
      </ScrollView>
    </View>
  );
}
