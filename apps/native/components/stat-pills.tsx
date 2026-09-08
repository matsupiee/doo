import { cn } from "heroui-native";
import { Text, View } from "react-native";

export type Stat = {
  label: string;
  value: string;
  /** 1つだけをアクセント色にして、いま見るべき数字を示す。 */
  isHighlighted?: boolean;
};

/** 見出しの下に並べる、ラベル付きの小さな数字ピル。 */
export function StatPills({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null;

  return (
    <View className="flex-row gap-2">
      {stats.map((stat) => (
        <View key={stat.label} className="flex-1 gap-1.5">
          <Text className="text-muted text-[11px]" numberOfLines={1}>
            {stat.label}
          </Text>
          <View
            className={cn(
              "h-9 rounded-full items-center justify-center px-2",
              stat.isHighlighted ? "bg-accent" : "bg-surface-secondary",
            )}
          >
            <Text
              className={cn(
                "text-sm font-semibold",
                stat.isHighlighted ? "text-accent-foreground" : "text-foreground",
              )}
              numberOfLines={1}
            >
              {stat.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
