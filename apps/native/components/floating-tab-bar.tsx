import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/tabs";
import * as Haptics from "expo-haptics";
import { cn } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type IconName = keyof typeof Ionicons.glyphMap;

/** タブごとのアイコン。ルート名で引く。 */
const icons: Record<string, IconName> = {
  index: "flame",
  create: "add",
  profile: "person",
};

/** 画面の下に浮かせるタブバーの高さ。画面側の余白計算に使う。 */
export const FLOATING_TAB_BAR_HEIGHT = 64;

/** 選んでいるタブだけをアクセント色のピルにする、浮いたタブバー。 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-0 right-0 px-5"
      style={{ bottom: Math.max(insets.bottom, 12), pointerEvents: "box-none" }}
    >
      <View className="flex-row bg-surface rounded-full p-2 gap-1">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const isFocused = state.index === index;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (isFocused || event.defaultPrevented) return;

                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate(route.name, route.params);
              }}
              className={cn(
                "h-12 flex-row items-center justify-center gap-1.5 rounded-full active:opacity-80",
                isFocused ? "flex-1 bg-accent px-4" : "w-14 bg-transparent",
              )}
            >
              <StyledIonicons
                name={icons[route.name] ?? "ellipse"}
                size={19}
                className={isFocused ? "text-accent-foreground" : "text-muted"}
              />
              {isFocused ? (
                <Text className="text-accent-foreground text-sm font-semibold" numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
