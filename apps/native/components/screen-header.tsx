import { Text, View } from "react-native";

type Props = {
  /** 見出しの上に出す小さな行。挨拶や画面の位置づけを書く。 */
  eyebrow?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
};

/**
 * 画面のいちばん上に置く見出し。ナビゲーションバーは使わず、
 * 大きな文字をそのまま背景の上に置くのがこのデザインの決まり。
 */
export function ScreenHeader({ eyebrow, title, right }: Props) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 shrink">{eyebrow}</View>
        {right}
      </View>
      <Text className="text-foreground text-[34px] font-extrabold leading-[40px]">{title}</Text>
    </View>
  );
}

/** 「Hello, さん 👋」の行。 */
export function Greeting({ name }: { name: string }) {
  return (
    <Text className="text-muted text-lg" numberOfLines={1}>
      こんにちは、<Text className="text-foreground font-extrabold">{name}</Text> 👋
    </Text>
  );
}
