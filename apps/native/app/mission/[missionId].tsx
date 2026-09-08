import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Input, Label, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompletionRow } from "@/components/completion-row";
import { MediaUploadField } from "@/components/media-upload-field";
import { Pill } from "@/components/pill";
import { formatWhen } from "@/components/post-card";
import { RoundIconButton } from "@/components/round-icon-button";
import { SectionTitle } from "@/components/section-title";
import { UserPicker } from "@/components/user-picker";
import { cardShadow, toneStyleFor } from "@/theme/tones";
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
      <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 8 }}>
        <RoundIconButton
          name="chevron-back"
          variant="surface"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
        />
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-foreground font-extrabold">このやりたいことは見つかりません</Text>
          <Text className="text-muted text-sm">すでに削除された可能性があります。</Text>
        </View>
      </View>
    );
  }

  const tone = toneStyleFor(missionId);
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
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* 色の面をそのまま画面の頭に置き、白い面をその上に少し重ねる。 */}
        <View
          className="px-5 pb-14 gap-6"
          style={{ backgroundColor: tone.background, paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center justify-between">
            <RoundIconButton
              name="chevron-back"
              color={tone.onWhite}
              accessibilityLabel="戻る"
              onPress={() => router.back()}
            />
            {mission.isParticipant ? (
              <Pill label="参加中" variant="light" color={tone.onWhite} />
            ) : (
              <RoundIconButton
                name="add"
                color={tone.onWhite}
                accessibilityLabel="このやりたいことに参加する"
                onPress={() => join.mutate({ missionId })}
              />
            )}
          </View>

          <View className="gap-2">
            <Text
              className="text-[32px] font-extrabold leading-10"
              style={{ color: tone.foreground }}
            >
              {mission.title}
            </Text>
            <Text className="text-sm" style={{ color: tone.mutedForeground }}>
              登録: {mission.creatorName}・{formatWhen(mission.createdAt)}
            </Text>
          </View>

          {mission.tags.length ? (
            <View className="flex-row flex-wrap gap-2">
              {mission.tags.map((tag) => (
                <Pill key={tag} label={`#${tag}`} variant="light" color={tone.onWhite} />
              ))}
            </View>
          ) : null}
        </View>

        <View className="bg-background rounded-t-[32px] -mt-8 px-5 pt-7 gap-7">
          <View className="flex-row gap-2">
            <Pill label={`参加 ${mission.participants.length}人`} variant="solid" />
            <Pill label={`達成 ${mission.completions.length}件`} />
          </View>

          {mission.description ? (
            <View className="gap-2">
              <SectionTitle title="説明" />
              <Text className="text-muted text-[15px] leading-6">{mission.description}</Text>
            </View>
          ) : null}

          <View className="gap-3">
            <SectionTitle title={`参加している人（${mission.participants.length}人）`} />

            <View className="flex-row flex-wrap gap-2">
              {mission.participants.map((participant) => (
                <Pill
                  key={participant.userId}
                  label={
                    participant.userId === mission.creatorId
                      ? `${participant.name}（登録した人）`
                      : participant.name
                  }
                />
              ))}
            </View>

            {mission.isParticipant ? (
              mission.isCreator ? (
                <Button
                  className="rounded-full"
                  variant="secondary"
                  isDisabled={remove.isPending}
                  onPress={() => remove.mutate({ missionId })}
                >
                  <Button.Label>やりたいことを削除する</Button.Label>
                </Button>
              ) : (
                <Button
                  className="rounded-full"
                  variant="secondary"
                  isDisabled={leave.isPending}
                  onPress={() => leave.mutate({ missionId })}
                >
                  <Button.Label>抜ける</Button.Label>
                </Button>
              )
            ) : (
              <Button
                className="rounded-full"
                isDisabled={join.isPending}
                onPress={() => join.mutate({ missionId })}
              >
                <Button.Label>参加する</Button.Label>
              </Button>
            )}

            {mission.isCreator ? (
              <Text className="text-muted text-xs">
                登録した人は抜けられません。やめるときはやりたいことごと削除します。
              </Text>
            ) : null}
            {!mission.isCreator && mission.isParticipant && mission.myCompletionCount > 0 ? (
              <Text className="text-muted text-xs">自分の達成があるので抜けられません。</Text>
            ) : null}
          </View>

          {mission.isParticipant ? (
            <View className="bg-surface rounded-[26px] p-5 gap-4" style={cardShadow}>
              <Text className="text-foreground text-lg font-extrabold">達成・進捗を投稿する</Text>

              <View className="flex-row gap-2">
                {mediaOptions.map((option) => (
                  <Pill
                    key={option.value}
                    label={option.label}
                    variant={mediaType === option.value ? "solid" : "muted"}
                    onPress={() => {
                      // アップロード済みのファイルは前の種類のものなので捨てる。
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
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
              </TextField>

              <View className="gap-2">
                <Text className="text-foreground text-sm font-semibold">
                  一緒に達成した人（{companionIds.length}人）
                </Text>
                <Text className="text-muted text-xs">
                  選ぶと共同達成になります。参加していない人を選ぶと、その場で参加者になります。
                </Text>

                {isPickingCompanions ? (
                  <UserPicker
                    selectedIds={companionIds}
                    onChange={setCompanionIds}
                    max={MAX_COMPANIONS}
                  />
                ) : null}

                <Button
                  size="sm"
                  className="rounded-full"
                  variant="secondary"
                  onPress={() => setIsPickingCompanions((value) => !value)}
                >
                  <Button.Label>
                    {isPickingCompanions ? "選び終わった" : "一緒に達成した人を選ぶ"}
                  </Button.Label>
                </Button>
              </View>

              <Button
                className="rounded-full h-14"
                isDisabled={!canPost}
                onPress={() => complete.mutate({ missionId, participantIds: companionIds, ...media })}
              >
                {complete.isPending ? (
                  <Spinner size="sm" color="default" />
                ) : (
                  <Button.Label className="font-extrabold">達成として投稿する</Button.Label>
                )}
              </Button>

              <Button
                className="rounded-full"
                variant="secondary"
                isDisabled={!canPost}
                onPress={() => postProgress.mutate({ missionId, ...media })}
              >
                {postProgress.isPending ? (
                  <Spinner size="sm" color="default" />
                ) : (
                  <Button.Label>進捗として投稿する</Button.Label>
                )}
              </Button>
            </View>
          ) : null}

          <View className="gap-3">
            <SectionTitle title={`達成（${mission.completions.length}件）`} />

            {mission.completions.length === 0 ? (
              <View className="bg-surface rounded-[22px] p-5" style={cardShadow}>
                <Text className="text-muted text-sm">まだ達成はありません。</Text>
              </View>
            ) : null}

            {mission.completions.map((completion) => (
              <CompletionRow
                key={completion.completionId}
                toneKey={missionId}
                title={`${completion.participants.map((row) => row.name).join("・")}${
                  completion.participants.length > 1 ? " が共同で達成" : " が達成"
                }`}
                subtitle={formatWhen(completion.completedAt)}
                caption={completion.caption}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
