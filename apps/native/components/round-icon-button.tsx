import { Ionicons } from "@expo/vector-icons";
import { Pressable, View, type ViewStyle } from "react-native";

import { brandColors, cardShadow, inkOnWhite } from "@/theme/tones";

type Variant = "light" | "solid" | "surface";

type Props = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  size?: number;
  variant?: Variant;
  /** 塗りの上に置くときに、白丸の中のアイコンを塗りの色に合わせる。 */
  color?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

const variantStyles: Record<Variant, { background: string; icon: string }> = {
  light: { background: "#ffffff", icon: inkOnWhite },
  solid: { background: brandColors.brand, icon: "#ffffff" },
  surface: { background: brandColors.surfaceTint, icon: inkOnWhite },
};

/**
 * カードの角や見出しの横に置く丸ボタン。塗りの面にひとつだけ白丸が乗っている、
 * というのがこのデザインの基本形なので、他のボタンと混ぜずにこれを使う。
 */
export function RoundIconButton({
  name,
  onPress,
  size = 44,
  variant = "light",
  color,
  accessibilityLabel,
  style,
}: Props) {
  const palette = variantStyles[variant];

  const content = (
    <View
      className="items-center justify-center"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.background,
        },
        cardShadow,
        style,
      ]}
    >
      <Ionicons name={name} size={size * 0.45} color={color ?? palette.icon} />
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="active:opacity-70"
    >
      {content}
    </Pressable>
  );
}
