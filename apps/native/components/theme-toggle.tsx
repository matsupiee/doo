import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { HeaderIconButton } from "@/components/screen-header";
import { useAppTheme } from "@/contexts/app-theme-context";

export function ThemeToggle() {
  const { toggleTheme, isLight } = useAppTheme();

  return (
    <HeaderIconButton
      icon={isLight ? "moon" : "sunny"}
      onPress={() => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleTheme();
      }}
    />
  );
}
