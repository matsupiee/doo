import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { useGradientId } from "@/components/ig/gradient";

const RING_SIZE = 68;

type Props = {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
};

/**
 * タグ絞り込みを、Instagram のストーリートレイの形で出す。
 * 選択中のタグはグラデーションのリング、未選択はグレーのリングになる。
 */
export function StoryRail({ tags, selected, onToggle, onClear }: Props) {
  if (!tags.length) return null;

  return (
    <View className="border-b border-border">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 14 }}
      >
        <StoryBubble
          label="すべて"
          isActive={selected.length === 0}
          onPress={onClear}
          icon="apps-outline"
        />
        {tags.map((tag) => (
          <StoryBubble
            key={tag}
            label={tag}
            isActive={selected.includes(tag)}
            onPress={() => onToggle(tag)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function StoryBubble({
  label,
  isActive,
  onPress,
  icon,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const gradientId = useGradientId();
  const inner = RING_SIZE - 8;

  return (
    <Pressable onPress={onPress} className="items-center gap-1.5 active:opacity-60">
      <View style={{ width: RING_SIZE, height: RING_SIZE }} className="items-center justify-center">
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: "absolute" }}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#f9ce34" />
              <Stop offset="50%" stopColor="#ee2a7b" />
              <Stop offset="100%" stopColor="#6228d7" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={(RING_SIZE - 2.5) / 2}
            stroke={isActive ? `url(#${gradientId})` : "#c7c7c7"}
            strokeWidth={isActive ? 2.5 : 1.5}
            fill="none"
          />
        </Svg>

        <View
          style={{ width: inner, height: inner, borderRadius: inner / 2 }}
          className="bg-surface-tertiary items-center justify-center overflow-hidden px-1"
        >
          {icon ? (
            <Ionicons name={icon} size={22} color="#8e8e8e" />
          ) : (
            <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
              {label.slice(0, 2)}
            </Text>
          )}
        </View>
      </View>

      <Text
        className={isActive ? "text-foreground text-xs" : "text-muted text-xs"}
        numberOfLines={1}
        style={{ maxWidth: RING_SIZE }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
