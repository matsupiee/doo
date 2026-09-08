import { Pressable, Text, View } from "react-native";

import { Pill } from "@/components/pill";
import { RoundIconButton } from "@/components/round-icon-button";
import { cardShadow, toneStyleFor } from "@/theme/tones";

type Props = {
  missionId: string;
  title: string;
  /** タイトルの下に出す一行。登録した人など。 */
  subtitle?: string;
  tags?: string[];
  /** カードの下に並べる小さな情報。 */
  stats?: string[];
  onPress?: () => void;
};

/**
 * やりたいこと1件を、色の付いた面として見せるカード。
 * 一覧はこのカードの色違いが並ぶ形になる。
 */
export function MissionCard({ missionId, title, subtitle, tags = [], stats = [], onPress }: Props) {
  const tone = toneStyleFor(missionId);

  return (
    <Pressable onPress={onPress} disabled={!onPress} className="active:opacity-90">
      <View
        className="rounded-[26px] p-5 gap-4"
        style={[{ backgroundColor: tone.background }, cardShadow]}
      >
        <View className="flex-row items-start gap-3">
          <View className="flex-1 gap-1">
            <Text
              className="text-[22px] font-extrabold leading-7"
              style={{ color: tone.foreground }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-sm" style={{ color: tone.mutedForeground }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {onPress ? (
            <RoundIconButton
              name="arrow-forward"
              size={40}
              color={tone.onWhite}
              onPress={onPress}
            />
          ) : null}
        </View>

        {tags.length ? (
          <View className="flex-row flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
              <Pill key={tag} label={`#${tag}`} variant="light" color={tone.onWhite} />
            ))}
          </View>
        ) : null}

        {stats.length ? (
          <View className="flex-row flex-wrap gap-2">
            {stats.map((stat) => (
              <Pill key={stat} label={stat} variant="light" />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
