import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";

export default function TabLayout() {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const border = useThemeColor("border");

  return (
    <Tabs
      screenOptions={{
        // ヘッダーはどちらの画面も自前で組むので、Tabs 側は出さない。
        headerShown: false,
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
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
