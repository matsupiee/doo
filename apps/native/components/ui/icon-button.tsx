import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { useToneColors } from "@/components/ui/panel";

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  /** 面と同じ色で塗って、アイコンだけ抜くとき。 */
  variant?: "solid" | "outline";
};

/** スクショの右上にある丸ボタン。面の色に合わせて反転する。 */
export function RoundIconButton({ name, onPress, size = 36, variant = "solid" }: Props) {
  const colors = useToneColors();
  const isSolid = variant === "solid";

  const inner = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isSolid ? colors.foreground : "transparent",
        borderWidth: isSolid ? 0 : 1.5,
        borderColor: colors.foreground,
      }}
    >
      <Ionicons
        name={name}
        size={size * 0.5}
        color={isSolid ? colors.background : colors.foreground}
      />
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {inner}
    </Pressable>
  );
}
