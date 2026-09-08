import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/components/floating-tab-bar";

export default function TabLayout() {
  return (
    // ヘッダーは各画面が ScreenHeader で持つので、ナビゲーション側では出さない。
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "ホーム" }} />
      <Tabs.Screen name="create" options={{ title: "作成" }} />
      <Tabs.Screen name="profile" options={{ title: "プロフィール" }} />
    </Tabs>
  );
}
