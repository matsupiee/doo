import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useToneColors } from "@/components/ui/panel";
import { radius, toneStyles, type Tone } from "@/components/ui/theme";

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  isDisabled?: boolean;
  isPending?: boolean;
  size?: "sm" | "md";
  /** outline は面の色に関わらず読める、控えめなボタン。 */
  variant?: "solid" | "outline";
  /** 右端に丸い矢印を出す。主役のボタンだけに使う。 */
  hasArrow?: boolean;
};

/** ピル型の主要ボタン。色は面と同じブランド色から選ぶ。 */
export function ActionButton({
  label,
  onPress,
  tone = "violet",
  isDisabled = false,
  isPending = false,
  size = "md",
  variant = "solid",
  hasArrow = false,
}: Props) {
  const surface = useThemeColor("surface");
  const foreground = useThemeColor("foreground");
  const panel = useToneColors();
  const solidColors =
    tone === "surface" ? { background: surface, foreground } : toneStyles[tone];
  const isOutline = variant === "outline";
  const colors = isOutline
    ? { background: "transparent", foreground: panel.foreground }
    : solidColors;
  const height = size === "sm" ? 40 : 54;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled || isPending}
      style={({ pressed }) => ({
        height,
        paddingHorizontal: size === "sm" ? 16 : 22,
        borderRadius: radius.pill,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: hasArrow ? "space-between" : "center",
        backgroundColor: colors.background,
        borderWidth: isOutline ? 1.5 : 0,
        borderColor: colors.foreground,
        opacity: isDisabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      {isPending ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <>
          <Text
            style={{
              color: colors.foreground,
              fontSize: size === "sm" ? 13 : 15,
              fontWeight: "700",
            }}
          >
            {label}
          </Text>
          {hasArrow ? (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.foreground,
              }}
            >
              <Ionicons name="arrow-forward" size={16} color={isOutline ? panel.background : colors.background} />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
