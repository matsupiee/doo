import { Chip } from "heroui-native";
import { View } from "react-native";

/** やりたいことと投稿カードに出す、読むだけのタグ。 */
export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Chip key={tag} variant="secondary" size="sm">
          <Chip.Label>{tag}</Chip.Label>
        </Chip>
      ))}
    </View>
  );
}
