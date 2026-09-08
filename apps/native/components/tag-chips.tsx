import { Text, View } from "react-native";

/** やりたいことと投稿カードに出す、読むだけのタグ。 */
export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {tags.map((tag) => (
        <View key={tag} className="h-7 px-3 rounded-full bg-surface-tertiary justify-center">
          <Text className="text-foreground text-xs">{tag}</Text>
        </View>
      ))}
    </View>
  );
}
