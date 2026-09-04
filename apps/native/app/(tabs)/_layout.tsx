import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

import { ThemeToggle } from "@/components/theme-toggle";

export default function TabLayout() {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: background },
        headerTintColor: foreground,
        headerTitleStyle: { color: foreground, fontWeight: "600" },
        headerRight: () => <ThemeToggle />,
        tabBarStyle: { backgroundColor: background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          headerTitle: "みんなの達成",
          tabBarIcon: ({ color, size }) => <Ionicons name="flame" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "作成",
          headerTitle: "ミッションを作る",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "プロフィール",
          headerTitle: "プロフィール",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
