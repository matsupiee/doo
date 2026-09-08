import { router, Stack } from "expo-router";
import { View } from "react-native";

import { ActionButton } from "@/components/ui/action-button";
import { Panel, PanelMutedText, PanelTitle } from "@/components/ui/panel";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 justify-center bg-background px-4 gap-3">
        <Panel tone="yellow" className="p-6 gap-2">
          <PanelTitle size={28}>ページがありません</PanelTitle>
          <PanelMutedText style={{ fontSize: 13 }}>
            開こうとした画面は見つかりませんでした。
          </PanelMutedText>
        </Panel>
        <ActionButton label="ホームに戻る" tone="violet" hasArrow onPress={() => router.replace("/")} />
      </View>
    </>
  );
}
