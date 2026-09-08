import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "heroui-native";
import { Platform, Pressable, View } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { useAppTheme } from "@/contexts/app-theme-context";

/** 画面右上の丸ボタン。ライトとダークを切り替える。 */
export function ThemeToggle() {
  const { toggleTheme, isLight } = useAppTheme();
  const foreground = useThemeColor("foreground");

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleTheme();
      }}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: foreground,
        }}
      >
        {isLight ? (
          <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
            <Ionicons name="moon" size={18} color={foreground} />
          </Animated.View>
        ) : (
          <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
            <Ionicons name="sunny" size={18} color={foreground} />
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}
