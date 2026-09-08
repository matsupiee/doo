import { Text, View } from "react-native";

/** アバターの右に並ぶ、Instagram の「投稿・フォロワー・フォロー中」にあたる3つの数字。 */
export function ProfileStats({ stats }: { stats: { label: string; value: number }[] }) {
  return (
    <View className="flex-1 flex-row items-center justify-around">
      {stats.map((stat) => (
        <View key={stat.label} className="items-center">
          <Text className="text-foreground text-[17px] font-bold">{stat.value}</Text>
          <Text className="text-foreground text-[13px]">{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
