import { Pressable, Text, View } from "react-native";

import { useToneColors } from "@/components/ui/panel";
import { radius } from "@/components/ui/theme";

type Props = {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
};

/** 面の上に並べるピル。選ぶと前景色で塗りつぶす。 */
export function Pill({ label, isSelected = false, onPress, size = "md" }: Props) {
  const colors = useToneColors();
  const paddingVertical = size === "sm" ? 5 : 8;
  const paddingHorizontal = size === "sm" ? 10 : 14;

  const inner = (
    <View
      style={{
        paddingVertical,
        paddingHorizontal,
        borderRadius: radius.pill,
        backgroundColor: isSelected ? colors.foreground : "transparent",
        borderWidth: 1,
        borderColor: isSelected ? colors.foreground : `${colors.muted}`,
      }}
    >
      <Text
        style={{
          color: isSelected ? colors.background : colors.foreground,
          fontSize: size === "sm" ? 11 : 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {inner}
    </Pressable>
  );
}
