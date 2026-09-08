import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  Spinner,
  TextField,
  useToast,
} from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { MediaUploadField } from "@/components/media-upload-field";
import { formatWhen } from "@/components/post-card";
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
      <Container className="px-4">
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
    !isPosting &&
    (!needsMedia || mediaUrl !== null) &&
    (needsMedia || caption.trim().length > 0);

  const media = {
    mediaType,
    mediaUrl: needsMedia ? (mediaUrl ?? undefined) : undefined,
    caption: caption.trim() || undefined,
  };

  return (
    <Container className="px-4" scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <View className="gap-4 py-4">
        <Card variant="secondary" className="p-4 gap-2">
          <Text className="text-foreground text-lg font-semibold">🎯 {mission.title}</Text>
          {mission.description ? (
            <Text className="text-muted text-sm">{mission.description}</Text>
          ) : null}
          <TagChips tags={mission.tags} />
          <Text className="text-muted text-xs">
            登録: {mission.creatorName}・{formatWhen(mission.createdAt)}
          </Text>
        </Card>

        <Card variant="secondary" className="p-4 gap-3">
          <Card.Title>参加している人（{mission.participants.length}人）</Card.Title>
          <View className="flex-row flex-wrap gap-2">
            {mission.participants.map((participant) => (
              <Chip key={participant.userId} variant="secondary" size="sm">
                <Chip.Label>
                  {participant.name}
                  {participant.userId === mission.creatorId ? "（登録した人）" : ""}
                </Chip.Label>
              </Chip>
            ))}
          </View>

          {mission.isParticipant ? (
            <View className="flex-row gap-2">
              {mission.isCreator ? (
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
              )}
            </View>
          ) : (
            <Button
              size="sm"
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
            <Text className="text-muted text-xs">
              自分の達成があるので抜けられません。
            </Text>
          ) : null}
        </Card>

        {mission.isParticipant ? (
          <Card variant="secondary" className="p-4 gap-3">
            <Card.Title>達成・進捗を投稿する</Card.Title>

            <View className="flex-row gap-2">
              {mediaOptions.map((option) => (
                // `onPress` goes on the Chip itself: it renders its own Pressable,
                // so a wrapping Pressable never sees the touch.
                <Chip
                  key={option.value}
                  variant={mediaType === option.value ? "primary" : "secondary"}
                  color={mediaType === option.value ? "success" : "default"}
                  onPress={() => {
                    // The uploaded file belongs to the previous kind — drop it.
                    if (option.value !== mediaType) setMediaUrl(null);
                    setMediaType(option.value);
                  }}
                >
                  <Chip.Label>{option.label}</Chip.Label>
                </Chip>
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
              onPress={() =>
                complete.mutate({ missionId, participantIds: companionIds, ...media })
              }
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
          </Card>
        ) : null}

        <View className="gap-3 pb-8">
          <Text className="text-foreground text-lg font-semibold">
            達成（{mission.completions.length}件）
          </Text>

          {mission.completions.length === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">まだ達成はありません。</Text>
            </Card>
          ) : null}

          {mission.completions.map((completion) => (
            <Card key={completion.completionId} variant="secondary" className="p-4 gap-1">
              <Text className="text-foreground font-semibold">
                {completion.participants.map((row) => row.name).join("・")}
                {completion.participants.length > 1 ? " が共同で達成" : " が達成"}
              </Text>
              <Text className="text-muted text-xs">{formatWhen(completion.completedAt)}</Text>
              {completion.caption ? (
                <Text className="text-foreground text-sm mt-1">{completion.caption}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      </View>
    </Container>
  );
}
