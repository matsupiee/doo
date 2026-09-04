import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Chip, Input, Label, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { UserPicker } from "@/components/user-picker";
import { queryClient, trpc } from "@/utils/trpc";

type MediaType = "photo" | "video" | "text";
type HandoffMode = "nominated" | "random" | "ended";

const mediaOptions: { value: MediaType; label: string }[] = [
  { value: "photo", label: "写真" },
  { value: "video", label: "動画" },
  { value: "text", label: "テキスト" },
];

const handoffOptions: { value: HandoffMode; label: string; hint: string }[] = [
  { value: "nominated", label: "次の人を指名", hint: "渡したい人を自分で選ぶ" },
  { value: "random", label: "ランダムで指名", hint: "まだ参加していない人から1人選ばれる" },
  { value: "ended", label: "ここで止める", hint: "このチェーンはあなたで終わり" },
];

export default function ClearMissionScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { toast } = useToast();

  const [mediaType, setMediaType] = useState<MediaType>("photo");
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [handoff, setHandoff] = useState<HandoffMode>("nominated");
  const [nextAssigneeIds, setNextAssigneeIds] = useState<string[]>([]);

  const inbox = useQuery(trpc.mission.inbox.queryOptions());
  const item = inbox.data?.find((entry) => entry.assignmentId === assignmentId);
  const isRelay = Boolean(item?.relayId);
  const maxNominations = item?.relayMaxNominations ?? 1;

  const clear = useMutation(
    trpc.mission.clear.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries();
        toast.show({
          variant: "success",
          label: result.passedTo
            ? `達成を投稿して、${result.passedTo}人にバトンを渡しました`
            : "達成を投稿しました",
        });
        router.back();
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  if (inbox.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (!item) {
    return (
      <Container className="px-4">
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-foreground font-semibold">このミッションは見つかりません</Text>
          <Text className="text-muted text-sm">すでに達成済みか、辞退した可能性があります。</Text>
        </View>
      </Container>
    );
  }

  const needsUrl = mediaType !== "text";
  const canSubmit =
    !clear.isPending &&
    (!needsUrl || mediaUrl.trim().length > 0) &&
    (mediaType !== "text" || caption.trim().length > 0) &&
    (!isRelay || handoff !== "nominated" || nextAssigneeIds.length > 0);

  return (
    <Container className="px-4" scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <View className="gap-4 py-4">
        <Card variant="secondary" className="p-4 gap-1">
          <Text className="text-foreground text-lg font-semibold">🎯 {item.title}</Text>
          {item.description ? (
            <Text className="text-muted text-sm">{item.description}</Text>
          ) : null}
          {item.proofHint ? (
            <Text className="text-muted text-xs mt-1">証明: {item.proofHint}</Text>
          ) : null}
        </Card>

        <Card variant="secondary" className="p-4 gap-3">
          <Card.Title>達成の証明</Card.Title>

          <View className="flex-row gap-2">
            {mediaOptions.map((option) => (
              <Pressable key={option.value} onPress={() => setMediaType(option.value)}>
                <Chip
                  variant={mediaType === option.value ? "primary" : "secondary"}
                  color={mediaType === option.value ? "success" : "default"}
                >
                  <Chip.Label>{option.label}</Chip.Label>
                </Chip>
              </Pressable>
            ))}
          </View>

          {needsUrl ? (
            <TextField>
              <Label>{mediaType === "photo" ? "写真のURL" : "動画のURL"}</Label>
              <Input
                value={mediaUrl}
                onChangeText={setMediaUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />
            </TextField>
          ) : null}

          <TextField>
            <Label>ひとこと{mediaType === "text" ? "" : "（任意）"}</Label>
            <Input
              value={caption}
              onChangeText={setCaption}
              placeholder="どうやってクリアした？"
              multiline
              numberOfLines={3}
              maxLength={500}
              style={{ minHeight: 72, textAlignVertical: "top" }}
            />
          </TextField>
        </Card>

        {isRelay ? (
          <Card variant="secondary" className="p-4 gap-3">
            <Card.Title>バトンをどうする？</Card.Title>

            <View className="gap-2">
              {handoffOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setHandoff(option.value)}
                  className={`rounded-lg border p-3 active:opacity-70 ${
                    handoff === option.value ? "border-success" : "border-border"
                  }`}
                >
                  <Text className="text-foreground font-medium">{option.label}</Text>
                  <Text className="text-muted text-xs">{option.hint}</Text>
                </Pressable>
              ))}
            </View>

            {handoff === "nominated" ? (
              <UserPicker
                selectedIds={nextAssigneeIds}
                onChange={setNextAssigneeIds}
                max={maxNominations}
              />
            ) : null}
          </Card>
        ) : null}

        <Button
          className="mb-8"
          isDisabled={!canSubmit}
          onPress={() =>
            clear.mutate({
              assignmentId: item.assignmentId,
              mediaType,
              mediaUrl: needsUrl ? mediaUrl.trim() : undefined,
              caption: caption.trim() || undefined,
              handoff: isRelay
                ? handoff === "nominated"
                  ? { mode: "nominated", assigneeIds: nextAssigneeIds }
                  : { mode: handoff }
                : undefined,
            })
          }
        >
          {clear.isPending ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>達成として投稿する</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}
