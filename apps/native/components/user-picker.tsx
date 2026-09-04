import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Input, Spinner, TextField, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { trpc } from "@/utils/trpc";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Upper bound on the selection, e.g. the relay's nominations-per-hop limit. */
  max: number;
  excludeIds?: string[];
};

/** Search-and-tap list used both when creating a mission and when passing a baton. */
export function UserPicker({ selectedIds, onChange, max, excludeIds = [] }: Props) {
  const [query, setQuery] = useState("");
  const successColor = useThemeColor("success");
  const mutedColor = useThemeColor("muted");

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
    <View className="gap-3">
      <TextField>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="名前で検索"
          autoCapitalize="none"
        />
      </TextField>

      <Text className="text-muted text-xs">
        {selectedIds.length} / {max} 人を選択中
      </Text>

      {users.isLoading ? <Spinner size="sm" /> : null}

      {!users.isLoading && candidates.length === 0 ? (
        <Text className="text-muted text-sm">該当するユーザーがいません。</Text>
      ) : null}

      <View className="gap-2">
        {candidates.map((candidate) => {
          const isSelected = selectedIds.includes(candidate.id);
          const isDisabled = !isSelected && selectedIds.length >= max;

          return (
            <Pressable
              key={candidate.id}
              onPress={() => toggle(candidate.id)}
              className={`flex-row items-center gap-3 rounded-lg border p-3 active:opacity-70 ${
                isSelected ? "border-success" : "border-border"
              } ${isDisabled ? "opacity-40" : ""}`}
            >
              <View className="w-8 h-8 rounded-full bg-accent items-center justify-center">
                <Text className="text-foreground font-semibold">
                  {candidate.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text className="flex-1 text-foreground">{candidate.name}</Text>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={isSelected ? successColor : mutedColor}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
