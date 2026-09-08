import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Card, Chip, Input, Label, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
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
    <Container className="px-4" scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <View className="gap-4 py-4">
        <Card variant="secondary" className="p-4 gap-3">
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
        </Card>

        <Card variant="secondary" className="p-4 gap-3">
          <Card.Title>タグ（任意・複数可）</Card.Title>
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
                  className="active:opacity-70"
                >
                  <Chip variant="primary" color="success" size="sm">
                    <Chip.Label>{tag} ✕</Chip.Label>
                  </Chip>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Card>

        <Card variant="secondary" className="p-4 flex-row gap-3">
          <Ionicons name="information-circle-outline" size={20} color="#888" />
          <Text className="text-muted text-xs flex-1">
            登録すると自分が参加者になります。ほかのユーザーからも見えて、あとから参加してもらえます。
          </Text>
        </Card>

        <Button
          isDisabled={!canSubmit}
          className="mb-8"
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
