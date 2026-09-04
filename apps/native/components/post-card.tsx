import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Card, Chip, useThemeColor } from "heroui-native";
import { Image, Pressable, Text, View } from "react-native";

import { queryClient, trpc } from "@/utils/trpc";

export type FeedPost = {
  id: string;
  mediaType: "photo" | "video" | "text";
  mediaUrl: string | null;
  caption: string | null;
  /** Serialized over the wire, so this is an ISO string on the client. */
  createdAt: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  missionId: string;
  missionTitle: string;
  missionDescription: string | null;
  missionCreatorName: string;
  relayId: string | null;
  relayDepth: number;
  relayHandoff: "nominated" | "random" | "ended" | null;
  pickedBy: "self" | "nominated" | "random";
  reactionCount: number;
  reactedByMe: boolean;
};

const pickedByLabel = {
  self: "自分でチャレンジ",
  nominated: "指名された",
  random: "ランダムで当たった",
} as const;

export function formatWhen(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  const minutes = Math.floor((Date.now() - value.getTime()) / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export function PostCard({ post }: { post: FeedPost }) {
  const mutedColor = useThemeColor("muted");
  const dangerColor = useThemeColor("danger");

  const toggleReaction = useMutation(
    trpc.feed.toggleReaction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.feed.list.queryKey() });
      },
    }),
  );

  return (
    <Card variant="secondary" className="mb-4 overflow-hidden">
      <View className="flex-row items-center gap-3 p-4 pb-3">
        <View className="w-9 h-9 rounded-full bg-accent items-center justify-center overflow-hidden">
          {post.authorImage ? (
            <Image source={{ uri: post.authorImage }} className="w-9 h-9" />
          ) : (
            <Text className="text-foreground font-semibold">
              {post.authorName.slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{post.authorName}</Text>
          <Text className="text-muted text-xs">
            {pickedByLabel[post.pickedBy]}・{formatWhen(post.createdAt)}
          </Text>
        </View>
        {post.relayId ? (
          <Link href={{ pathname: "/relay/[relayId]", params: { relayId: post.relayId } }} asChild>
            <Pressable>
              <Chip variant="secondary" color="success" size="sm">
                <Chip.Label>リレー {post.relayDepth + 1}人目</Chip.Label>
              </Chip>
            </Pressable>
          </Link>
        ) : null}
      </View>

      <View className="px-4 pb-3">
        <Text className="text-foreground text-base font-semibold">🎯 {post.missionTitle}</Text>
        <Text className="text-muted text-xs mt-0.5">
          出題: {post.missionCreatorName}
        </Text>
      </View>

      {post.mediaType === "photo" && post.mediaUrl ? (
        <Image source={{ uri: post.mediaUrl }} className="w-full h-72" resizeMode="cover" />
      ) : null}

      {post.mediaType === "video" && post.mediaUrl ? (
        <View className="w-full h-48 bg-background items-center justify-center gap-2">
          <Ionicons name="play-circle" size={44} color={mutedColor} />
          <Text className="text-muted text-xs px-6 text-center" numberOfLines={1}>
            {post.mediaUrl}
          </Text>
        </View>
      ) : null}

      {post.caption ? (
        <Text className="text-foreground px-4 pt-3">{post.caption}</Text>
      ) : null}

      <View className="flex-row items-center gap-4 p-4">
        <Pressable
          className="flex-row items-center gap-1.5 active:opacity-60"
          onPress={() => toggleReaction.mutate({ postId: post.id })}
        >
          <Ionicons
            name={post.reactedByMe ? "heart" : "heart-outline"}
            size={22}
            color={post.reactedByMe ? dangerColor : mutedColor}
          />
          <Text className="text-muted text-sm">{post.reactionCount}</Text>
        </Pressable>
        {post.relayHandoff === "ended" && post.relayId ? (
          <Text className="text-muted text-xs">ここでリレー終了</Text>
        ) : null}
      </View>
    </Card>
  );
}
