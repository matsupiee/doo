import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { TagChips } from "@/components/tag-chips";

/** Instagram の検索結果やフォロー一覧と同じ形の、1行のリスト項目。 */
export function MissionRow({
  missionId,
  title,
  subtitle,
  tags = [],
}: {
  missionId: string;
  title: string;
  subtitle: string;
  tags?: string[];
}) {
  return (
    <Pressable
      className="flex-row items-center gap-3 px-4 py-2.5 active:bg-surface-secondary"
      onPress={() => router.push({ pathname: "/mission/[missionId]", params: { missionId } })}
    >
      <View className="w-11 h-11 rounded-full bg-surface-tertiary items-center justify-center">
        <Ionicons name="flag" size={20} color="#8e8e8e" />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-[14px] font-semibold" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-muted text-[13px]" numberOfLines={1}>
          {subtitle}
        </Text>
        {tags.length ? <TagChips tags={tags} /> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#8e8e8e" />
    </Pressable>
  );
}
