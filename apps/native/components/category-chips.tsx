import { Chip } from "heroui-native";
import { View } from "react-native";

import { categoryLabel } from "@/lib/mission-categories";

/** Read-only category badges shown on mission and post cards. */
export function CategoryChips({ categories }: { categories: string[] }) {
  if (!categories.length) return null;

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {categories.map((category) => (
        <Chip key={category} variant="secondary" size="sm">
          <Chip.Label>{categoryLabel(category)}</Chip.Label>
        </Chip>
      ))}
    </View>
  );
}
