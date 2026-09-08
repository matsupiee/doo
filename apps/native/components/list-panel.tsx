import { Ionicons } from "@expo/vector-icons";
import { cn } from "heroui-native";
import { type PropsWithChildren, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type IconName = keyof typeof Ionicons.glyphMap;

/** 見出しと件数を持つ、行を並べるためのパネル。 */
export function ListPanel({
  title,
  count,
  children,
}: PropsWithChildren<{ title: string; count?: string }>) {
  return (
    <View className="bg-surface rounded-3xl p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-xl font-light">{title}</Text>
        {count ? <Text className="text-muted text-sm">{count}</Text> : null}
      </View>
      <View className="gap-1">{children}</View>
    </View>
  );
}

type RowProps = {
  /** 先頭に置く四角いアイコンタイル。アバターを出すときは leading を使う。 */
  icon?: IconName;
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  /** 行の右端に出す短い文字。 */
  trailing?: string;
  onPress?: () => void;
};

export function ListRow({ icon, leading, title, subtitle, trailing, onPress }: RowProps) {
  const content = (
    <View className="flex-row items-center gap-3 py-2">
      {leading ??
        (icon ? (
          <View className="w-10 h-10 rounded-2xl bg-surface-tertiary items-center justify-center">
            <StyledIonicons name={icon} size={18} className="text-foreground" />
          </View>
        ) : null)}

      <View className="flex-1 gap-0.5">
        <Text className="text-foreground font-medium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-muted text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ? (
        <Text className="text-muted text-xs" numberOfLines={1}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} className={cn("active:opacity-70")}>
      {content}
    </Pressable>
  );
}

/** パネルの中に何も並べるものがないときの文。 */
export function ListEmpty({ children }: PropsWithChildren) {
  return <Text className="text-muted text-sm py-2">{children}</Text>;
}
