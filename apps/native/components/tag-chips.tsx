import { View } from "react-native";

import { Pill } from "@/components/ui/pill";

/** やりたいことと投稿カードに出す、読むだけのタグ。 */
export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Pill key={tag} label={tag} size="sm" />
      ))}
    </View>
  );
}
