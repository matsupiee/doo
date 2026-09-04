import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { HeroUINativeProvider, Spinner, useThemeColor } from "heroui-native";
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
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
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
    <Stack
      screenOptions={{
        headerTintColor: foreground,
        headerStyle: { backgroundColor: background },
        headerTitleStyle: { color: foreground, fontWeight: "600" },
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="mission/[assignmentId]"
          options={{ title: "ミッション達成", presentation: "modal" }}
        />
        <Stack.Screen name="relay/[relayId]" options={{ title: "リレー" }} />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
