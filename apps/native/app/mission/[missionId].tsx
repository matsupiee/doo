import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Input, Label, Spinner, TextField, cn, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { ListEmpty, ListPanel, ListRow } from "@/components/list-panel";
import { MediaUploadField } from "@/components/media-upload-field";
import { formatWhen } from "@/components/post-card";
import { ScreenHeader } from "@/components/screen-header";
import { StatPills } from "@/components/stat-pills";
import { TagChips } from "@/components/tag-chips";
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
      <Container>
        <ScreenHeader title="やりたいこと" hasBackButton />
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-foreground font-semibold">このやりたいことは見つかりません</Text>
          <Text className="text-muted text-sm">すでに削除された可能性があります。</Text>
        </View>
      </Container>
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
    <Container scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <ScreenHeader title={mission.title} eyebrow="やりたいこと" hasBackButton>
        <StatPills
          stats={[
            { label: "達成", value: `${mission.completions.length}`, isHighlighted: true },
            { label: "参加", value: `${mission.participants.length}人` },
            { label: "自分の達成", value: `${mission.myCompletionCount}` },
          ]}
        />
      </ScreenHeader>

      <View className="px-5 gap-3 pb-8">
        {mission.description || mission.tags.length ? (
          <View className="bg-surface rounded-3xl p-4 gap-3">
            {mission.description ? (
              <Text className="text-foreground text-sm leading-5">{mission.description}</Text>
            ) : null}
            <TagChips tags={mission.tags} />
            <Text className="text-muted text-xs">
              登録: {mission.creatorName}・{formatWhen(mission.createdAt)}
            </Text>
          </View>
        ) : null}

        <View className="bg-surface rounded-3xl p-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground text-xl font-light">参加している人</Text>
            <Text className="text-muted text-sm">{mission.participants.length}人</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {mission.participants.map((participant) => (
              <View
                key={participant.userId}
                className="h-8 px-3 rounded-full bg-surface-tertiary justify-center"
              >
                <Text className="text-foreground text-xs">
                  {participant.name}
                  {participant.userId === mission.creatorId ? "（登録した人）" : ""}
                </Text>
              </View>
            ))}
          </View>

          {mission.isParticipant ? (
            mission.isCreator ? (
              <Button
                size="sm"
                variant="secondary"
                isDisabled={remove.isPending}
                onPress={() => remove.mutate({ missionId })}
              >
                <Button.Label>やりたいことを削除する</Button.Label>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                isDisabled={leave.isPending}
                onPress={() => leave.mutate({ missionId })}
              >
                <Button.Label>抜ける</Button.Label>
              </Button>
            )
          ) : (
            <Button size="sm" isDisabled={join.isPending} onPress={() => join.mutate({ missionId })}>
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
          <View className="bg-surface rounded-3xl p-4 gap-3">
            <Text className="text-foreground text-xl font-light">達成・進捗を投稿する</Text>

            <View className="flex-row gap-2">
              {mediaOptions.map((option) => {
                const isSelected = mediaType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      // The uploaded file belongs to the previous kind — drop it.
                      if (option.value !== mediaType) setMediaUrl(null);
                      setMediaType(option.value);
                    }}
                    className={cn(
                      "h-9 px-4 rounded-full items-center justify-center active:opacity-70",
                      isSelected ? "bg-accent" : "bg-surface-tertiary",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm",
                        isSelected ? "text-accent-foreground font-semibold" : "text-foreground",
                      )}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
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
              <Text className="text-foreground text-sm">
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
                variant="secondary"
                onPress={() => setIsPickingCompanions((value) => !value)}
              >
                <Button.Label>
                  {isPickingCompanions ? "選び終わった" : "一緒に達成した人を選ぶ"}
                </Button.Label>
              </Button>
            </View>

            <Button
              isDisabled={!canPost}
              onPress={() => complete.mutate({ missionId, participantIds: companionIds, ...media })}
            >
              {complete.isPending ? (
                <Spinner size="sm" color="default" />
              ) : (
                <Button.Label>達成として投稿する</Button.Label>
              )}
            </Button>

            <Button
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

        <ListPanel title="達成" count={`${mission.completions.length}件`}>
          {mission.completions.length === 0 ? <ListEmpty>まだ達成はありません。</ListEmpty> : null}

          {mission.completions.map((completion) => (
            <ListRow
              key={completion.completionId}
              icon="checkmark-circle"
              title={`${completion.participants.map((row) => row.name).join("・")}${
                completion.participants.length > 1 ? " が共同で達成" : " が達成"
              }`}
              subtitle={completion.caption ?? undefined}
              trailing={formatWhen(completion.completedAt)}
            />
          ))}
        </ListPanel>
      </View>
    </Container>
  );
}
