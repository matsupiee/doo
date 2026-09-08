import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    // 各画面が ScreenHeader を持つので、ナビゲーション側のヘッダーは出さない。
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
