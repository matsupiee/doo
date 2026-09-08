import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { cn } from "heroui-native";
import { type PropsWithChildren, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type IconName = keyof typeof Ionicons.glyphMap;

/** ヘッダーに並べる丸ボタン。アイコンだけを入れる。 */
export function HeaderIconButton({
  icon,
  onPress,
  isActive = false,
}: {
  icon: IconName;
  onPress: () => void;
  isActive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      className={cn(
        "w-11 h-11 rounded-full items-center justify-center active:opacity-70",
        isActive ? "bg-accent" : "bg-surface-secondary",
      )}
    >
      <StyledIonicons
        name={icon}
        size={19}
        className={isActive ? "text-accent-foreground" : "text-foreground"}
      />
    </Pressable>
  );
}

/** ヘッダーに並べる文字入りのピルボタン。 */
export function HeaderPillButton({
  label,
  onPress,
  isActive = false,
}: {
  label: string;
  onPress: () => void;
  isActive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "h-11 px-4 rounded-full items-center justify-center active:opacity-70",
        isActive ? "bg-accent" : "bg-surface-secondary",
      )}
    >
      <Text
        className={cn(
          "text-sm font-medium",
          isActive ? "text-accent-foreground" : "text-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type Props = {
  title: string;
  /** タイトルの上に出す小さい行。画面の位置づけを補う。 */
  eyebrow?: string;
  /** 右側に並べるボタン。丸ボタンやピルボタンを渡す。 */
  actions?: ReactNode;
  /** 左端に戻るボタンを出す。スタック画面で使う。 */
  hasBackButton?: boolean;
};

/**
 * 画面の上部。丸ボタンの行と、細字の大きなタイトルでできている。
 * children にはタイトル直下に置くもの（統計ピルなど）を渡す。
 */
export function ScreenHeader({
  title,
  eyebrow,
  actions,
  hasBackButton = false,
  children,
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-5 pb-4 gap-4" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2">
        {hasBackButton ? (
          <HeaderIconButton icon="arrow-back" onPress={() => router.back()} />
        ) : null}
        <View className="flex-1" />
        {actions}
      </View>

      <View className="gap-1">
        {eyebrow ? <Text className="text-muted text-xs">{eyebrow}</Text> : null}
        <Text className="text-foreground text-4xl font-light" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
}
