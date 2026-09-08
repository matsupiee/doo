import { Ionicons } from "@expo/vector-icons";
import { type BottomTabBarProps } from "expo-router/tabs";
import { useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand, radius } from "@/components/ui/theme";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home",
  create: "add",
  profile: "person",
};

/** 画面の上に浮かぶタブバー。選んでいるタブだけ色の丸で塗る。 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const surface = useThemeColor("surface");
  const muted = useThemeColor("muted");

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom + 12,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          padding: 8,
          borderRadius: radius.pill,
          backgroundColor: surface,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = icons[route.name] ?? "ellipse";

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={({ pressed }) => ({
                width: 52,
                height: 44,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isFocused ? brand.violet : "transparent",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name={iconName} size={22} color={isFocused ? "#ffffff" : muted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
