import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

type Item = { id: string; label: string; missionId: string };

/**
 * Instagram のハイライトの位置に、参加しているやりたいことを丸で並べる。
 * ハイライトと同じく、リングは細いグレー。
 */
export function HighlightRail({ items }: { items: Item[] }) {
  if (!items.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14, gap: 16 }}
    >
      {items.map((item) => (
        <Pressable
          key={item.id}
          className="items-center gap-1.5 active:opacity-60"
          onPress={() =>
            router.push({
              pathname: "/mission/[missionId]",
              params: { missionId: item.missionId },
            })
          }
        >
          <View className="w-16 h-16 rounded-full border border-border items-center justify-center p-[3px]">
            <View className="flex-1 w-full rounded-full bg-surface-tertiary items-center justify-center">
              <Ionicons name="flag" size={22} color="#8e8e8e" />
            </View>
          </View>
          <Text className="text-foreground text-[11px]" numberOfLines={1} style={{ maxWidth: 64 }}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
