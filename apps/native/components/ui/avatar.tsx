import { Image, Text, View } from "react-native";

import { useToneColors } from "@/components/ui/panel";
import { toneForAvatar, toneStyles } from "@/components/ui/theme";

/** 画像がなければ、名前の頭文字を色付きの丸に置く。 */
export function Avatar({
  name,
  imageUrl,
  seed,
  size = 40,
}: {
  name: string;
  imageUrl?: string | null;
  /** 色を決めるキー。省略したら名前で決める。 */
  seed?: string;
  size?: number;
}) {
  const panel = useToneColors();
  // 色の面の上では、面と同じ色になって消えないように面の前景色で描く。
  const tone = panel.isTinted
    ? { background: `${panel.foreground}26`, foreground: panel.foreground }
    : toneStyles[toneForAvatar(seed ?? name)];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tone.background,
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: tone.foreground, fontSize: size * 0.4, fontWeight: "800" }}>
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
