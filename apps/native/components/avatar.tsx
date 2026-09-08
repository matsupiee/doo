import { Image, Text, View } from "react-native";

type Props = {
  name: string;
  image?: string | null;
  size?: number;
};

/** 丸いアイコン。画像が無ければ頭文字を出す。 */
export function Avatar({ name, image, size = 40 }: Props) {
  return (
    <View
      className="bg-surface-tertiary items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width: size, height: size }} />
      ) : (
        <Text className="text-foreground font-extrabold" style={{ fontSize: size * 0.4 }}>
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
