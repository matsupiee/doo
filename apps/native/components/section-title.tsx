import { Text, View } from "react-native";

type Props = {
  title: string;
  action?: React.ReactNode;
};

/** 一覧の上に置く見出し。太さで階層を作り、罫線は引かない。 */
export function SectionTitle({ title, action }: Props) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-foreground text-xl font-extrabold">{title}</Text>
      {action}
    </View>
  );
}
