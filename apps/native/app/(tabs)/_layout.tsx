import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";

import { Wordmark } from "@/components/ig/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TabLayout() {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const border = useThemeColor("border");

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: background,
          borderBottomWidth: 0.5,
          borderBottomColor: border,
          // Instagram のヘッダーは影を落とさず、細い線だけで本文と分ける
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: foreground,
        headerTitleStyle: { color: foreground, fontWeight: "600", fontSize: 16 },
        // Instagram のタブバーはラベルを出さず、アイコンだけを並べる
        tabBarShowLabel: false,
        tabBarActiveTintColor: foreground,
        tabBarInactiveTintColor: foreground,
        tabBarStyle: {
          backgroundColor: background,
          borderTopWidth: 0.5,
          borderTopColor: border,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <Wordmark />,
          headerLeft: () => <View className="w-3" />,
          headerTitleAlign: "left",
          headerRight: () => (
            <View className="flex-row items-center gap-4 pr-4">
              <ThemeToggle />
              <Pressable className="active:opacity-50">
                <Ionicons name="heart-outline" size={26} color={foreground} />
              </Pressable>
              <Pressable className="active:opacity-50">
                <Ionicons name="paper-plane-outline" size={24} color={foreground} />
              </Pressable>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          headerTitle: "新規投稿",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          // Instagram では自分のタブだけ、選択中に丸い枠が付く
          tabBarIcon: ({ color, focused }) => (
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                borderWidth: focused ? 1.5 : 0,
                borderColor: color,
              }}
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={focused ? 16 : 25}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
