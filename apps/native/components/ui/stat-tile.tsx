import { View } from "react-native";

import { Panel, PanelEyebrow, PanelTitle } from "@/components/ui/panel";
import { type Tone } from "@/components/ui/theme";

/** 数字を大きく見せる小さい面。プロフィールの達成数などに使う。 */
export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: Tone;
}) {
  return (
    <Panel tone={tone} borderRadius={20} className="flex-1 px-4 py-3">
      <View className="gap-1">
        <PanelEyebrow>{label}</PanelEyebrow>
        <PanelTitle size={28}>{value}</PanelTitle>
      </View>
    </Panel>
  );
}
