import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Spinner, useThemeColor, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { queryClient, trpc } from "@/utils/trpc";

const MAX_TAGS = 10;

export default function CreateMissionScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const foreground = useThemeColor("foreground");
  const placeholder = useThemeColor("muted");

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
        // 登録画面は残さず、そのまま登録できたやりたいことへ入れ替える。
        router.replace({
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
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Instagram のシェア画面と同じく、サムネイルの横に本文を書く */}
        <View className="flex-row gap-3 px-4 py-3.5">
          <View className="w-[72px] h-[72px] rounded-sm bg-surface-tertiary items-center justify-center">
            <Ionicons name="flag" size={26} color="#8e8e8e" />
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="やりたいことを書く…"
            placeholderTextColor={placeholder}
            maxLength={80}
            multiline
            className="flex-1 text-foreground text-[15px]"
            style={{ color: foreground, paddingTop: 2, textAlignVertical: "top" }}
          />
        </View>

        <View className="h-[0.5px] bg-border mx-4" />

        <View className="px-4 py-3.5">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="説明を追加（任意）"
            placeholderTextColor={placeholder}
            maxLength={500}
            multiline
            className="text-foreground text-[15px]"
            style={{ color: foreground, minHeight: 60, textAlignVertical: "top" }}
          />
        </View>

        <View className="h-[0.5px] bg-border mx-4" />

        {/* タグは Instagram の「タグ付け」の行にあたる */}
        <View className="px-4 py-3.5 gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="pricetag-outline" size={20} color={foreground} />
            <TextInput
              value={tagDraft}
              onChangeText={setTagDraft}
              placeholder="タグを追加（例）料理"
              placeholderTextColor={placeholder}
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={addTag}
              className="flex-1 text-foreground text-[15px]"
              style={{ color: foreground }}
            />
            <Pressable
              onPress={addTag}
              disabled={!tagDraft.trim()}
              className="active:opacity-60"
              style={{ opacity: tagDraft.trim() ? 1 : 0.4 }}
            >
              <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
                追加
              </Text>
            </Pressable>
          </View>

          {tags.length ? (
            <View className="flex-row flex-wrap gap-x-2 gap-y-1">
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setTags((current) => current.filter((value) => value !== tag))}
                  className="flex-row items-center gap-1 active:opacity-60"
                >
                  <Text className="text-[14px]" style={{ color: "#0095f6" }}>
                    #{tag}
                  </Text>
                  <Ionicons name="close" size={13} color="#8e8e8e" />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View className="h-[0.5px] bg-border mx-4" />

        <View className="flex-row gap-2 px-4 py-3.5">
          <Ionicons name="earth-outline" size={18} color="#8e8e8e" />
          <Text className="text-muted text-[12px] flex-1" style={{ lineHeight: 17 }}>
            登録すると自分が参加者になります。ほかのユーザーからも見えて、あとから参加してもらえます。
          </Text>
        </View>

        <View className="px-4 pt-4">
          <Pressable
            onPress={() =>
              createMission.mutate({
                title: title.trim(),
                description: description.trim() || undefined,
                tags,
              })
            }
            disabled={!canSubmit}
            className="items-center justify-center rounded-lg py-2.5 active:opacity-80"
            style={{ backgroundColor: "#0095f6", opacity: canSubmit ? 1 : 0.4 }}
          >
            {createMission.isPending ? (
              <Spinner size="sm" color="default" />
            ) : (
              <Text className="text-white text-[15px] font-semibold">シェアする</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
