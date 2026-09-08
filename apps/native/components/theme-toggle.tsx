import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "heroui-native";
import { Platform, Pressable, View } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { useAppTheme } from "@/contexts/app-theme-context";
import { cardShadow } from "@/theme/tones";

/** 見出しの横に置く、ライトとダークの切り替え。丸ボタンの見た目に合わせている。 */
export function ThemeToggle() {
  const { toggleTheme, isLight } = useAppTheme();
  const surface = useThemeColor("surface");
  const foreground = useThemeColor("foreground");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isLight ? "ダークテーマにする" : "ライトテーマにする"}
      onPress={() => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleTheme();
      }}
      className="active:opacity-70"
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={[{ backgroundColor: surface }, cardShadow]}
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
