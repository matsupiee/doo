import { Text, View } from "react-native";

export type MetaItem = { label: string; value: string };

/** カードの中に、小さいラベルと値を横並びで置く。 */
export function MetaGrid({ items }: { items: MetaItem[] }) {
  if (!items.length) return null;

  return (
    <View className="flex-row gap-3">
      {items.map((item) => (
        <View key={item.label} className="flex-1 gap-0.5">
          <Text className="text-muted text-[11px]" numberOfLines={1}>
            {item.label}
          </Text>
          <Text className="text-foreground text-sm" numberOfLines={1}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
