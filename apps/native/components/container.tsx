import { cn } from "heroui-native";
import { type PropsWithChildren } from "react";
import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = AnimatedProps<ViewProps> & {
  className?: string;
  isScrollable?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, "contentContainerStyle">;
  /** 下に浮かぶタブバーに隠れないよう、内容の下に余白を足す。 */
  hasTabBar?: boolean;
  /** 上端のセーフエリアを内容の余白にする。見出しを自分で描く画面で使う。 */
  hasTopInset?: boolean;
};

export function Container({
  children,
  className,
  isScrollable = true,
  scrollViewProps,
  hasTabBar = false,
  hasTopInset = true,
  ...props
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();
  const paddingTop = hasTopInset ? insets.top : 0;
  const paddingBottom = insets.bottom + (hasTabBar ? 96 : 24);

  return (
    <AnimatedView className={cn("flex-1 bg-background", className)} {...props}>
      {isScrollable ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop, paddingBottom }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1" style={{ paddingTop, paddingBottom }}>
          {children}
        </View>
      )}
    </AnimatedView>
  );
}
