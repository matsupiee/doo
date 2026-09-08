import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { cardShadow, toneStyleFor } from "@/theme/tones";

type Props = {
  /** 色を決めるための ID。同じやりたいことなら同じ色になる。 */
  toneKey: string;
  title: string;
  subtitle: string;
  caption?: string | null;
};

/** 達成1件を表す行。左に丸いチェック、右にテキストという形をどの画面でも使う。 */
export function CompletionRow({ toneKey, title, subtitle, caption }: Props) {
  const tone = toneStyleFor(toneKey);

  return (
    <View className="bg-surface rounded-[22px] p-4 flex-row items-center gap-3" style={cardShadow}>
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: tone.background }}
      >
        <Ionicons name="checkmark" size={24} color={tone.foreground} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-foreground font-extrabold text-base">{title}</Text>
        <Text className="text-muted text-xs">{subtitle}</Text>
        {caption ? (
          <Text className="text-foreground text-sm mt-1" numberOfLines={3}>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
