import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";

import { backdropFor } from "@/components/ig/backdrop";
import { Gradient } from "@/components/ig/gradient";

export type GridItem = {
  completionId: string;
  missionId: string;
  missionTitle: string;
  mediaType: "photo" | "video" | "text";
  mediaUrl: string | null;
  caption: string | null;
  participants: { userId: string; name: string }[];
};

/** Instagram のプロフィールと同じ、1px 隙間の3列グリッド。 */
export function PostGrid({ items }: { items: GridItem[] }) {
  const { width } = useWindowDimensions();
  const cell = (width - 2) / 3;

  return (
    <View className="flex-row flex-wrap" style={{ gap: 1 }}>
      {items.map((item) => (
        <Pressable
          key={item.completionId}
          style={{ width: cell, height: cell }}
          className="active:opacity-70"
          onPress={() =>
            router.push({
              pathname: "/mission/[missionId]",
              params: { missionId: item.missionId },
            })
          }
        >
          <GridCell item={item} size={cell} />
        </Pressable>
      ))}
    </View>
  );
}

function GridCell({ item, size }: { item: GridItem; size: number }) {
  const backdrop = backdropFor(item.completionId);
  const hasPhoto = item.mediaType === "photo" && item.mediaUrl;

  return (
    <View className="flex-1 bg-surface-tertiary">
      {hasPhoto ? (
        <Image
          source={{ uri: item.mediaUrl as string }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : item.mediaType === "video" && item.mediaUrl ? (
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#111" }}>
          <Ionicons name="play" size={28} color="rgba(255,255,255,0.9)" />
        </View>
      ) : (
        <Gradient
          colors={backdrop}
          style={{ width: size, height: size }}
          className="items-center justify-center px-2"
        >
          <Text className="text-white text-[11px] font-semibold text-center" numberOfLines={4}>
            {item.caption ?? item.missionTitle}
          </Text>
        </Gradient>
      )}

      {/* Instagram が動画や複数枚に付けるのと同じ、右上の小さなしるし */}
      {item.mediaType === "video" ? (
        <View className="absolute top-1.5 right-1.5">
          <Ionicons name="play-circle" size={16} color="#fff" />
        </View>
      ) : item.participants.length > 1 ? (
        <View className="absolute top-1.5 right-1.5">
          <Ionicons name="people" size={15} color="#fff" />
        </View>
      ) : null}
    </View>
  );
}
