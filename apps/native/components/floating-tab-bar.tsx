import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { cardShadow } from "@/theme/tones";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const icons: Record<string, IconName> = {
  index: "home",
  create: "add",
  profile: "person",
};

/**
 * 画面の下に浮かせる丸いタブバー。選んでいるタブだけがブランド色のピルになり、
 * 残りはアイコンだけになる。画面いっぱいの罫線付きバーは使わない。
 */
export function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const surface = useThemeColor("surface");
  const muted = useThemeColor("muted");
  const accent = useThemeColor("accent");

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: insets.bottom + 12 }}
      pointerEvents="box-none"
    >
      <View
        className="flex-row items-center gap-1 rounded-full p-2"
        style={[{ backgroundColor: surface }, cardShadow]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const isFocused = state.index === index;
          const label = typeof options.title === "string" ? options.title : route.name;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              className="active:opacity-70"
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
            >
              <View
                className="flex-row items-center gap-2 rounded-full px-5 py-3"
                style={isFocused ? { backgroundColor: accent } : undefined}
              >
                <Ionicons
                  name={icons[route.name] ?? "ellipse"}
                  size={20}
                  color={isFocused ? "#ffffff" : muted}
                />
                {isFocused ? (
                  <Text className="text-[15px] font-bold" style={{ color: "#ffffff" }}>
                    {label}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
