import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ui/action-button";
import { Panel, PanelEyebrow, PanelMutedText, PanelTitle } from "@/components/ui/panel";

/** アプリを開いたときの入口。新規登録とログインのどちらかを選ぶ。 */
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background px-4"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 gap-3">
        <Text
          className="text-foreground"
          style={{ fontSize: 64, fontWeight: "800", letterSpacing: -3 }}
        >
          doo
        </Text>

        <Panel tone="violet" className="p-5 gap-1">
          <PanelEyebrow>WHAT IS DOO</PanelEyebrow>
          <PanelTitle size={28}>やりたいことを、{"\n"}やった記録に。</PanelTitle>
          <PanelMutedText style={{ fontSize: 13, marginTop: 6 }}>
            登録して、達成したら投稿する。ひとりでも、誰かと一緒でも。
          </PanelMutedText>
        </Panel>

        <View className="flex-row gap-3">
          <Panel tone="yellow" className="flex-1 p-4 gap-1">
            <PanelEyebrow>JOIN</PanelEyebrow>
            <PanelMutedText style={{ fontSize: 13 }}>
              他の人のやりたいことに、承認なしでその場で参加できる。
            </PanelMutedText>
          </Panel>
          <Panel tone="coral" className="flex-1 p-4 gap-1">
            <PanelEyebrow>SHARE</PanelEyebrow>
            <PanelMutedText style={{ fontSize: 13 }}>
              1件の達成に参加者がぶら下がる。共同達成もそのまま記録。
            </PanelMutedText>
          </Panel>
        </View>
      </View>

      <View className="gap-3">
        <ActionButton label="新規登録" tone="violet" hasArrow onPress={() => router.push("/sign-up")} />
        <ActionButton label="ログイン" variant="outline" onPress={() => router.push("/sign-in")} />
      </View>
    </View>
  );
}
