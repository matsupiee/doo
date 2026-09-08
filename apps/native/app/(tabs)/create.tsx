import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Input, Label, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { Pill } from "@/components/pill";
import { RoundIconButton } from "@/components/round-icon-button";
import { ScreenHeader } from "@/components/screen-header";
import { cardShadow } from "@/theme/tones";
import { queryClient, trpc } from "@/utils/trpc";

const MAX_TAGS = 10;

export default function CreateMissionScreen() {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const createMission = useMutation(
    trpc.mission.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries();
        toast.show({ variant: "success", label: "やりたいことを登録しました" });
        setTitle("");
        setDescription("");
        setTagDraft("");
        setTags([]);
        router.push({
          pathname: "/mission/[missionId]",
          params: { missionId: result.missionId },
        });
      },
      onError: (error) => {
        toast.show({ variant: "danger", label: error.message });
      },
    }),
  );

  /** タグは自由入力。同じタグは二重に持たない。 */
  function addTag() {
    const value = tagDraft.trim();
    if (!value || tags.includes(value) || tags.length >= MAX_TAGS) {
      setTagDraft("");
      return;
    }
    setTags((current) => [...current, value]);
    setTagDraft("");
  }

  const canSubmit = title.trim().length > 0 && !createMission.isPending;

  return (
    <Container className="px-5" hasTabBar>
      <View className="gap-6 pt-2">
        <ScreenHeader
          eyebrow={<Text className="text-muted text-lg">はじめよう</Text>}
          title={"やりたいことを\n登録する"}
        />

        <View
          className="bg-surface rounded-[26px] p-5 gap-4"
          style={cardShadow}
        >
          <TextField>
            <Label>やりたいこと</Label>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="例）パエリアを作る"
              maxLength={80}
            />
          </TextField>

          <TextField>
            <Label>説明（任意）</Label>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="どんなことをしたい？ 決めているルールがあれば書こう"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{ minHeight: 96, textAlignVertical: "top" }}
            />
          </TextField>
        </View>

        <View className="bg-surface rounded-[26px] p-5 gap-4" style={cardShadow}>
          <View className="gap-1">
            <Text className="text-foreground text-lg font-extrabold">タグ（任意・複数可）</Text>
            <Text className="text-muted text-xs">
              自由に書けます。ホームの絞り込みに使われます。
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <TextField>
                <Input
                  value={tagDraft}
                  onChangeText={setTagDraft}
                  placeholder="例）料理"
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={addTag}
                />
              </TextField>
            </View>
            <RoundIconButton
              name="add"
              variant="solid"
              accessibilityLabel="タグを追加する"
              onPress={addTag}
            />
          </View>

          {tags.length ? (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setTags((current) => current.filter((value) => value !== tag))}
                  className="active:opacity-70"
                >
                  <Pill label={`${tag} ✕`} variant="solid" />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View className="bg-surface-tertiary rounded-[26px] p-5">
          <Text className="text-muted text-xs leading-5">
            登録すると自分が参加者になります。ほかのユーザーからも見えて、あとから参加してもらえます。
          </Text>
        </View>

        <Button
          className="rounded-full h-14"
          isDisabled={!canSubmit}
          onPress={() =>
            createMission.mutate({
              title: title.trim(),
              description: description.trim() || undefined,
              tags,
            })
          }
        >
          {createMission.isPending ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label className="font-extrabold">やりたいことを登録する</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}
