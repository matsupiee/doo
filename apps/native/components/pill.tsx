import { Pressable, Text, View } from "react-native";

import { inkOnWhite } from "@/theme/tones";

type Variant = "muted" | "solid" | "light" | "outline";

type Props = {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  /** 塗りのカードに置くときに、文字色を塗りに合わせる。 */
  color?: string;
};

/**
 * 見出しの下のタグや、カードの中の「参加3人」のような小さな情報を包むピル。
 * 角丸は必ず全丸にして、面の四角さと対比させる。
 */
export function Pill({ label, variant = "muted", onPress, color }: Props) {
  const className =
    variant === "solid"
      ? "bg-accent"
      : variant === "light"
        ? "bg-white"
        : variant === "outline"
          ? "border border-border bg-transparent"
          : "bg-default";

  const textClassName =
    variant === "solid"
      ? "text-accent-foreground"
      : variant === "light"
        ? ""
        : "text-foreground";

  const body = (
    <View className={`rounded-full px-3.5 py-2 ${className}`}>
      <Text
        className={`text-[13px] font-semibold ${textClassName}`}
        style={variant === "light" ? { color: color ?? inkOnWhite } : undefined}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      {body}
    </Pressable>
  );
}
