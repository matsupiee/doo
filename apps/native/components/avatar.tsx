import { cn } from "heroui-native";
import { Image, Text, View } from "react-native";

const sizes = {
  sm: { box: "w-9 h-9", text: "text-sm" },
  md: { box: "w-11 h-11", text: "text-base" },
  lg: { box: "w-16 h-16", text: "text-2xl" },
} as const;

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
  /** 一覧では角丸の四角、単体では丸にする。 */
  shape?: "circle" | "squircle";
};

/** 画像があれば画像、なければ頭文字を出すアバター。 */
export function Avatar({ name, imageUrl, size = "md", shape = "circle" }: Props) {
  const style = sizes[size];
  const radius = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <View
      className={cn(
        style.box,
        radius,
        "bg-surface-tertiary items-center justify-center overflow-hidden",
      )}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className={cn(style.box)} resizeMode="cover" />
      ) : (
        <Text className={cn("text-foreground font-semibold", style.text)}>
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
