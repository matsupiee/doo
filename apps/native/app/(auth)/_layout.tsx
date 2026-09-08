import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function AuthLayout() {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerTintColor: foreground,
        headerStyle: { backgroundColor: background },
        // Instagram のヘッダーは影を落とさず、細い線だけで本文と分ける
        headerShadowVisible: true,
        headerTitleStyle: { color: foreground, fontWeight: "600", fontSize: 16 },
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: "登録" }} />
      <Stack.Screen name="sign-in" options={{ title: "ログイン" }} />
    </Stack>
  );
}
