import { cn } from "heroui-native";
import { Pressable, ScrollView, Text } from "react-native";

type Props = {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
};

/** 横に流れる選択チップ。選んだものだけアクセント色にする。 */
export function FilterChips({ options, selected, onToggle }: Props) {
  if (!options.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
      style={{ flexGrow: 0, flexShrink: 0 }}
    >
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => onToggle(option)}
            className={cn(
              "h-9 px-4 rounded-full items-center justify-center active:opacity-70",
              isSelected ? "bg-accent" : "bg-surface",
            )}
          >
            <Text
              className={cn(
                "text-sm",
                isSelected ? "text-accent-foreground font-semibold" : "text-foreground",
              )}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
