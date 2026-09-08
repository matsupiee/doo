import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

/** Instagram の「まだ投稿がありません」と同じ、丸い枠のアイコン付きの空表示。 */
export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View className="items-center justify-center gap-1.5 px-10 py-16">
      <View className="w-16 h-16 rounded-full border-2 border-foreground items-center justify-center">
        <Ionicons name={icon} size={28} color="#8e8e8e" />
      </View>
      <Text className="text-foreground text-lg font-bold mt-1">{title}</Text>
      <Text className="text-muted text-[13px] text-center">{body}</Text>
    </View>
  );
}
