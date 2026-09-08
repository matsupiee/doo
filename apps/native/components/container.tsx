import { cn } from "heroui-native";
import { type PropsWithChildren } from "react";
import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FLOATING_TAB_BAR_HEIGHT } from "@/components/floating-tab-bar";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = AnimatedProps<ViewProps> & {
  className?: string;
  isScrollable?: boolean;
  /** タブ画面では、浮いているタブバーのぶんだけ下に余白を足す。 */
  hasFloatingTabBar?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, "contentContainerStyle">;
};

export function Container({
  children,
  className,
  isScrollable = true,
  hasFloatingTabBar = false,
  scrollViewProps,
  ...props
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();
  const bottomSpace = hasFloatingTabBar ? FLOATING_TAB_BAR_HEIGHT + 40 : insets.bottom;

  return (
    <AnimatedView
      className={cn("flex-1 bg-background", className)}
      style={{ paddingBottom: hasFloatingTabBar ? 0 : insets.bottom }}
      {...props}
    >
      {isScrollable ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomSpace }}
          keyboardShouldPersistTaps="handled"
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </AnimatedView>
  );
}
