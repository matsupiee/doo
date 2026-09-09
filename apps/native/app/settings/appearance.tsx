import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme-context";

const themes = [
  { value: "light", label: "ライト", icon: "sunny-outline" },
  { value: "dark", label: "ダーク", icon: "moon-outline" },
] as const;

/** 設定の「外観」。テーマを選ぶとその場で切り替わる。 */
export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const { currentTheme, setTheme } = useAppTheme();
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <View className="px-4 pt-5 pb-2">
        <Text className="text-foreground text-[13px] font-semibold">テーマ</Text>
      </View>

      {themes.map((item) => (
        <Pressable
          key={item.value}
          className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-60"
          onPress={() => setTheme(item.value)}
        >
          <Ionicons name={item.icon} size={22} color={foreground} />
          <Text className="flex-1 text-foreground text-[15px]">{item.label}</Text>
          {currentTheme === item.value ? (
            <Ionicons name="checkmark" size={20} color={foreground} />
          ) : null}
        </Pressable>
      ))}

      <View className="px-4 pt-2">
        <Text className="text-[13px]" style={{ color: muted }}>
          選んだテーマはアプリ全体に反映されます。
        </Text>
      </View>

      <View style={{ height: insets.bottom + 24 }} />
    </ScrollView>
  );
}
