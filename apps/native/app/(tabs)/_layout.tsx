import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/components/floating-tab-bar";

/**
 * ヘッダーは置かず、各画面が自分で大きな見出しを描く。
 * タブバーは画面の下に浮かぶピルに差し替える。
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "ホーム" }} />
      <Tabs.Screen name="create" options={{ title: "作成" }} />
      <Tabs.Screen name="profile" options={{ title: "自分" }} />
    </Tabs>
  );
}
