import { Spinner, useThemeColor } from "heroui-native";
import { forwardRef } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

/**
 * Instagram のログインフォームの入力欄。ラベルは置かず、
 * 角丸のグレー地に細い枠、中の文字はプレースホルダーだけで説明する。
 */
export const IgField = forwardRef<TextInput, TextInputProps>(function IgField(props, ref) {
  const foreground = useThemeColor("foreground");
  const placeholder = useThemeColor("muted");

  return (
    // 枠の内側どこを触っても入力できるよう、余白は TextInput 自身に持たせる。
    <View className="rounded-md border border-border bg-surface-secondary">
      <TextInput
        ref={ref}
        placeholderTextColor={placeholder}
        {...props}
        className="text-[14px]"
        style={{ color: foreground, paddingHorizontal: 12, paddingVertical: 14 }}
      />
    </View>
  );
});

/** Instagram の青いログインボタン。 */
export function IgButton({
  label,
  onPress,
  isDisabled,
  isPending,
}: {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  isPending?: boolean;
}) {
  return (
    <Pressable
      onPress={isDisabled || isPending ? undefined : onPress}
      className="items-center justify-center rounded-lg py-3 active:opacity-80"
      style={{ backgroundColor: "#0095f6", opacity: isDisabled ? 0.4 : 1 }}
    >
      {isPending ? (
        <Spinner size="sm" color="default" />
      ) : (
        <Text className="text-white text-[14px] font-semibold">{label}</Text>
      )}
    </Pressable>
  );
}
