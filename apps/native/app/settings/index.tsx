import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

/** プロフィールの歯車から開く設定画面。項目は上から順に並べるだけ。 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isLight } = useAppTheme();

  function confirmSignOut() {
    Alert.alert("サインアウト", "サインアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "サインアウト",
        style: "destructive",
        onPress: () => {
          authClient.signOut();
          queryClient.clear();
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <SettingsSection title="設定" />

      <SettingsRow
        label="外観"
        icon="contrast-outline"
        value={isLight ? "ライト" : "ダーク"}
        onPress={() => router.push("/settings/appearance")}
      />

      <SettingsSection title="アカウント" />

      <SettingsRow
        label="サインアウト"
        icon="log-out-outline"
        tone="danger"
        onPress={confirmSignOut}
      />

      <View style={{ height: insets.bottom + 24 }} />
    </ScrollView>
  );
}

/** 項目のまとまりの見出し。Instagram の設定と同じく、小さく左に置く。 */
function SettingsSection({ title }: { title: string }) {
  return (
    <View className="px-4 pt-5 pb-2">
      <Text className="text-foreground text-[13px] font-semibold">{title}</Text>
    </View>
  );
}

/** 設定の1行。右端に今の値かシェブロンを出す。 */
function SettingsRow({
  label,
  icon,
  value,
  tone = "default",
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: string;
  tone?: "default" | "danger";
  onPress: () => void;
}) {
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");
  const color = tone === "danger" ? "#ed4956" : foreground;

  return (
    <Pressable
      className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-60"
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text className="flex-1 text-[15px]" style={{ color }}>
        {label}
      </Text>
      {value ? <Text className="text-[13px]" style={{ color: muted }}>{value}</Text> : null}
      {tone === "danger" ? null : (
        <Ionicons name="chevron-forward" size={16} color={muted} />
      )}
    </Pressable>
  );
}
