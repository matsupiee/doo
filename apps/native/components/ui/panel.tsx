import { useThemeColor } from "heroui-native";
import { createContext, useContext, type PropsWithChildren } from "react";
import { Pressable, Text, View, type TextProps, type ViewProps } from "react-native";

import { radius, toneStyles, type Tone } from "@/components/ui/theme";

type ToneColors = {
  background: string;
  foreground: string;
  muted: string;
  /** ブランド色で塗った面かどうか。上に置くものの色をここで変える。 */
  isTinted: boolean;
};

const ToneContext = createContext<ToneColors | null>(null);

/** 面の上に置くテキストが、その面に合った色を選べるようにする。 */
export function useToneColors(): ToneColors {
  const surface = useThemeColor("surface");
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");
  return useContext(ToneContext) ?? { background: surface, foreground, muted, isTinted: false };
}

function useResolvedTone(tone: Tone): ToneColors {
  const surface = useThemeColor("surface");
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");
  if (tone === "surface") return { background: surface, foreground, muted, isTinted: false };
  return { ...toneStyles[tone], isTinted: true };
}

type PanelProps = PropsWithChildren<
  ViewProps & {
    tone?: Tone;
    onPress?: () => void;
    /** 角丸を上書きしたいとき（画像を敷く面など）。 */
    borderRadius?: number;
  }
>;

/** 大きく丸めた色の面。スクショのカード1枚ぶんにあたる。 */
export function Panel({
  tone = "surface",
  onPress,
  borderRadius = radius.panel,
  children,
  style,
  ...props
}: PanelProps) {
  const colors = useResolvedTone(tone);
  const content = (
    <ToneContext.Provider value={colors}>{children}</ToneContext.Provider>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { backgroundColor: colors.background, borderRadius, opacity: pressed ? 0.85 : 1 },
          style as object,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[{ backgroundColor: colors.background, borderRadius }, style]} {...props}>
      {content}
    </View>
  );
}

/** 面の見出し。日本語でも行が詰まらないように、行の高さも文字サイズから決める。 */
export function PanelTitle({ size = 22, style, ...props }: TextProps & { size?: number }) {
  const colors = useToneColors();
  return (
    <Text
      style={[
        {
          color: colors.foreground,
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
          fontWeight: "800",
          letterSpacing: -0.6,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function PanelText({ style, ...props }: TextProps) {
  const colors = useToneColors();
  return <Text style={[{ color: colors.foreground, fontSize: 14 }, style]} {...props} />;
}

export function PanelMutedText({ style, ...props }: TextProps) {
  const colors = useToneColors();
  return <Text style={[{ color: colors.muted, fontSize: 12 }, style]} {...props} />;
}

/** 面の上の小さいラベル。見出しの上に置く。 */
export function PanelEyebrow({ style, ...props }: TextProps) {
  const colors = useToneColors();
  return (
    <Text
      style={[
        { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
        style,
      ]}
      {...props}
    />
  );
}
