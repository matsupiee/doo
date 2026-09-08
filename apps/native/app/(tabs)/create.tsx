import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Input, Label, Spinner, TextField, useThemeColor, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { ScreenHeader } from "@/components/screen-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { queryClient, trpc } from "@/utils/trpc";

const MAX_TAGS = 10;

export default function CreateMissionScreen() {
  const { toast } = useToast();
  const mutedColor = useThemeColor("muted");

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
    <Container
      hasFloatingTabBar
      scrollViewProps={{ showsVerticalScrollIndicator: false }}
    >
      <ScreenHeader title="やりたいこと" eyebrow="新しく登録する" actions={<ThemeToggle />} />

      <View className="px-5 gap-3">
        <View className="bg-surface rounded-3xl p-4 gap-3">
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
              style={{ minHeight: 88, textAlignVertical: "top" }}
            />
          </TextField>
        </View>

        <View className="bg-surface rounded-3xl p-4 gap-3">
          <Text className="text-foreground text-lg font-light">タグ（任意・複数可）</Text>
          <Text className="text-muted text-xs">
            自由に書けます。フィードの絞り込みに使われます。
          </Text>

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
            <Button size="sm" variant="secondary" isDisabled={!tagDraft.trim()} onPress={addTag}>
              <Button.Label>追加</Button.Label>
            </Button>
          </View>

          {tags.length ? (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setTags((current) => current.filter((value) => value !== tag))}
                  className="h-8 px-3 rounded-full bg-accent flex-row items-center gap-1 active:opacity-70"
                >
                  <Text className="text-accent-foreground text-xs font-medium">{tag}</Text>
                  <Ionicons name="close" size={13} color="#23282d" />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View className="bg-surface rounded-3xl p-4 flex-row gap-3">
          <Ionicons name="information-circle-outline" size={20} color={mutedColor} />
          <Text className="text-muted text-xs flex-1 leading-5">
            登録すると自分が参加者になります。ほかのユーザーからも見えて、あとから参加してもらえます。
          </Text>
        </View>

        <Button
          isDisabled={!canSubmit}
          className="mt-1"
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
            <Button.Label>やりたいことを登録する</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}
