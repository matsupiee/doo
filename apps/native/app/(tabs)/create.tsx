import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Input, Label, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ui/action-button";
import { Panel, PanelEyebrow, PanelMutedText, PanelTitle } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { ScreenHeader } from "@/components/ui/screen-header";
import { queryClient, trpc } from "@/utils/trpc";

const MAX_TAGS = 10;

export default function CreateMissionScreen() {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();

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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="やりたいこと" eyebrow="NEW MISSION" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 110,
          gap: 12,
        }}
      >
        <Panel tone="violet" className="p-5 gap-1">
          <PanelEyebrow>STEP 1</PanelEyebrow>
          <PanelTitle size={26}>なにをやりたい？</PanelTitle>
          <PanelMutedText style={{ fontSize: 13, marginTop: 4 }}>
            登録すると自分が参加者になります。ほかのユーザーからも見えて、あとから参加してもらえます。
          </PanelMutedText>
        </Panel>

        <Panel className="p-4 gap-3">
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
        </Panel>

        <Panel className="p-4 gap-3">
          <View className="gap-1">
            <PanelTitle size={18}>タグ</PanelTitle>
            <PanelMutedText>
              任意・複数可。自由に書けます。フィードの絞り込みに使われます。
            </PanelMutedText>
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
            <ActionButton
              label="追加"
              size="sm"
              variant="outline"
              isDisabled={!tagDraft.trim()}
              onPress={addTag}
            />
          </View>

          {tags.length ? (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <Pill
                  key={tag}
                  label={`${tag} ✕`}
                  isSelected
                  size="sm"
                  onPress={() => setTags((current) => current.filter((value) => value !== tag))}
                />
              ))}
            </View>
          ) : null}
        </Panel>

        <Panel tone="yellow" className="p-4">
          <PanelMutedText style={{ fontSize: 13 }}>
            達成は誰か1人のものではなく、参加者みんなにぶら下がります。
            同じやりたいことは、何度でも達成として記録できます。
          </PanelMutedText>
        </Panel>

        <ActionButton
          label="やりたいことを登録する"
          tone="coral"
          hasArrow
          isDisabled={!canSubmit}
          isPending={createMission.isPending}
          onPress={() =>
            createMission.mutate({
              title: title.trim(),
              description: description.trim() || undefined,
              tags,
            })
          }
        />
      </ScrollView>
    </View>
  );
}
