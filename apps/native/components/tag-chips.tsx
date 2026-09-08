import { Text } from "react-native";

/**
 * タグは Instagram のハッシュタグと同じく、チップではなく青い文字で出す。
 */
export function TagChips({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;

  return (
    <Text className={className ?? "text-[13px]"} style={{ color: "#0095f6" }} numberOfLines={2}>
      {tags.map((tag) => `#${tag}`).join(" ")}
    </Text>
  );
}
