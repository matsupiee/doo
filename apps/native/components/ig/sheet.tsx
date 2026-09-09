import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SheetProps = {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** 中身が長いときにスクロールさせる。メニューのように短いものは false のままでよい。 */
  isScrollable?: boolean;
};

/**
 * Instagram の下から出るシート。背景を押すか、上のつまみを下げる代わりに
 * 背景タップで閉じる。メニュー・投稿フォーム・参加者一覧で使い回す。
 */
export function Sheet({ isVisible, onClose, title, children, isScrollable }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose} />

      <View
        className="bg-background rounded-t-2xl"
        style={{ paddingBottom: insets.bottom + 8, maxHeight: "85%" }}
      >
        {/* つまみ。Instagram と同じく中身の上に小さく置くだけ */}
        <View className="items-center pt-2.5 pb-1">
          <View className="w-9 h-1 rounded-full bg-surface-tertiary" />
        </View>

        {title ? (
          <View className="px-4 pb-2.5 border-b border-border">
            <Text className="text-foreground text-[15px] font-semibold text-center">{title}</Text>
          </View>
        ) : null}

        {isScrollable ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </Modal>
  );
}

/** シートの中に並ぶ行。3点リーダーのメニュー項目に使う。 */
export function SheetMenuItem({
  label,
  icon,
  tone = "default",
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "default" | "danger";
  onPress: () => void;
}) {
  const foreground = useThemeColor("foreground");
  const color = tone === "danger" ? "#ed4956" : undefined;

  return (
    <Pressable
      className="flex-row items-center gap-3 px-4 py-4 active:opacity-60"
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={color ?? foreground} />
      <Text
        className={`text-[15px] ${tone === "danger" ? "" : "text-foreground"}`}
        style={color ? { color } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
