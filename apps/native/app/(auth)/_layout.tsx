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
        headerTitleStyle: { color: foreground, fontWeight: "600" },
        contentStyle: { backgroundColor: background },
        headerBackTitle: "戻る",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
    </Stack>
  );
}
