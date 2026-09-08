import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { HeroUINativeProvider, Spinner } from "heroui-native";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

/** doo のすべてがアカウント前提なので、未ログインなら (auth) 側だけを見せる。 */
function StackLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  const isSignedIn = !!session?.user;

  return (
    // 画面の上部は各画面の ScreenHeader が担当するので、ヘッダーは出さない。
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mission/[missionId]" />
        <Stack.Screen name="user/[userId]" />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <StackLayout />
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
