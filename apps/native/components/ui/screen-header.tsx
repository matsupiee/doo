import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

/** スクショの画面上部。丸い戻るボタン＋太い見出し＋右のスロット。 */
export function ScreenHeader({
  title,
  eyebrow,
  onBack,
  right,
}: {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return (
    <View className="flex-row items-center gap-3 px-4 pt-2 pb-4">
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: foreground,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={22} color={background} />
        </Pressable>
      ) : null}

      <View className="flex-1">
        {eyebrow ? (
          <Text
            style={{ color: foreground, opacity: 0.5, fontSize: 11, fontWeight: "700", letterSpacing: 1.4 }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={{
            color: foreground,
            fontSize: 30,
            lineHeight: 40,
            fontWeight: "800",
            letterSpacing: -1,
          }}
        >
          {title}
        </Text>
      </View>

      {right}
    </View>
  );
}
