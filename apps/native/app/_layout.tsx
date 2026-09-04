import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AuthGate } from "@/components/auth-gate";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function StackLayout() {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerTintColor: foreground,
        headerStyle: { backgroundColor: background },
        headerTitleStyle: { color: foreground, fontWeight: "600" },
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="mission/[assignmentId]"
        options={{ title: "ミッション達成", presentation: "modal" }}
      />
      <Stack.Screen name="relay/[relayId]" options={{ title: "リレー" }} />
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
              <AuthGate>
                <StackLayout />
              </AuthGate>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
