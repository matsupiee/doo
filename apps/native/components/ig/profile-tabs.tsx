import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";

type Tab = "grid" | "missions";

/** グリッドと一覧を切り替える、Instagram のプロフィール中央のタブ。 */
export function ProfileTabs({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (value: Tab) => void;
}) {
  const foreground = useThemeColor("foreground");

  return (
    <View className="flex-row border-t border-border">
      {(["grid", "missions"] as const).map((tab) => {
        const isActive = value === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            className="flex-1 items-center py-2.5"
            style={{
              borderBottomWidth: 1.5,
              borderBottomColor: isActive ? foreground : "transparent",
            }}
          >
            <Ionicons
              name={tab === "grid" ? "grid-outline" : "list-outline"}
              size={24}
              color={isActive ? foreground : "#8e8e8e"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
