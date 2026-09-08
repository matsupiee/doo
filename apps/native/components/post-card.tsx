import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Card, Chip, useThemeColor } from "heroui-native";
import { Image, Pressable, Text, View } from "react-native";

import { TagChips } from "@/components/tag-chips";
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
  missionTags: string[];
  /** 達成報告なら達成の ID、進捗報告なら null。 */
  completionId: string | null;
  completedAt: string | null;
  /** 達成の参加者。1人なら個人達成、複数人なら共同達成。 */
  completionParticipants: { userId: string; name: string }[];
  reactionCount: number;
  reactedByMe: boolean;
};

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

  const others = post.completionParticipants.filter((row) => row.userId !== post.authorId);

  return (
    <Card variant="secondary" className="mb-4 overflow-hidden">
      <View className="flex-row items-center gap-3 p-4 pb-3">
        <Link href={{ pathname: "/user/[userId]", params: { userId: post.authorId } }} asChild>
          <Pressable className="flex-row items-center gap-3 flex-1 active:opacity-70">
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
                {post.completionId ? "達成" : "進捗"}・
                {formatWhen(post.completedAt ?? post.createdAt)}
              </Text>
            </View>
          </Pressable>
        </Link>
        {post.completionParticipants.length > 1 ? (
          <Chip variant="secondary" color="success" size="sm">
            <Chip.Label>共同達成 {post.completionParticipants.length}人</Chip.Label>
          </Chip>
        ) : null}
      </View>

      <View className="px-4 pb-3">
        <Link href={{ pathname: "/mission/[missionId]", params: { missionId: post.missionId } }}>
          <Text className="text-foreground text-base font-semibold">🎯 {post.missionTitle}</Text>
        </Link>
        <Text className="text-muted text-xs mt-0.5">登録: {post.missionCreatorName}</Text>
        {others.length ? (
          <Text className="text-muted text-xs mt-0.5">
            一緒に達成: {others.map((row) => row.name).join("・")}
          </Text>
        ) : null}
        {post.missionTags.length ? (
          <View className="mt-2">
            <TagChips tags={post.missionTags} />
          </View>
        ) : null}
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

      {post.caption ? <Text className="text-foreground px-4 pt-3">{post.caption}</Text> : null}

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
      </View>
    </Card>
  );
}
