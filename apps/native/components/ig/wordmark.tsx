import { Platform, Text } from "react-native";

/**
 * ヘッダーに出すロゴ。Instagram の Billabong と同じ役どころで、
 * 端末にある筆記体寄りのセリフ体を斜体で使う。
 */
const brandFont = Platform.select({
  ios: "Snell Roundhand",
  android: "serif",
  default: "serif",
});

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <Text
      className="text-foreground"
      style={{
        fontFamily: brandFont,
        fontSize: size,
        fontWeight: "700",
        fontStyle: Platform.OS === "ios" ? "normal" : "italic",
        includeFontPadding: false,
      }}
    >
      doo
    </Text>
  );
}
