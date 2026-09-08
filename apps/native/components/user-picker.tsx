import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/ig/avatar";
import { trpc } from "@/utils/trpc";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** 選べる人数の上限。共同達成に並べられる人数に合わせる。 */
  max: number;
  excludeIds?: string[];
};

/** 名前で探してタップで選ぶ一覧。Instagram のタグ付け画面と同じ形。 */
export function UserPicker({ selectedIds, onChange, max, excludeIds = [] }: Props) {
  const [query, setQuery] = useState("");
  const foreground = useThemeColor("foreground");
  const placeholder = useThemeColor("muted");

  const users = useQuery(trpc.user.search.queryOptions({ query, limit: 30 }));
  const candidates = (users.data ?? []).filter((item) => !excludeIds.includes(item.id));

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selected) => selected !== id));
      return;
    }
    if (selectedIds.length >= max) return;
    onChange([...selectedIds, id]);
  }

  return (
    <View className="gap-2">
      {/* Instagram の検索欄: 角丸のグレー地に虫めがね */}
      <View className="flex-row items-center gap-2 rounded-lg bg-surface-tertiary px-3 py-2">
        <Ionicons name="search" size={16} color="#8e8e8e" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="名前で検索"
          placeholderTextColor={placeholder}
          autoCapitalize="none"
          className="flex-1 text-foreground text-[15px]"
          style={{ color: foreground, paddingVertical: 0 }}
        />
      </View>

      <Text className="text-muted text-[12px]">
        {selectedIds.length} / {max} 人を選択中
      </Text>

      {users.isLoading ? <Spinner size="sm" /> : null}

      {!users.isLoading && candidates.length === 0 ? (
        <Text className="text-muted text-[13px]">該当するユーザーがいません。</Text>
      ) : null}

      {candidates.map((candidate) => {
        const isSelected = selectedIds.includes(candidate.id);
        const isDisabled = !isSelected && selectedIds.length >= max;

        return (
          <Pressable
            key={candidate.id}
            onPress={() => toggle(candidate.id)}
            className="flex-row items-center gap-3 py-2 active:opacity-60"
            style={isDisabled ? { opacity: 0.4 } : undefined}
          >
            <Avatar name={candidate.name} uri={candidate.image} size={40} />
            <Text className="flex-1 text-foreground text-[14px] font-semibold">
              {candidate.name}
            </Text>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={isSelected ? "#0095f6" : "#c7c7c7"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
