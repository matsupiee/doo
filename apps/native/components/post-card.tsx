import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { cn, useThemeColor } from "heroui-native";
import { Image, Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { MetaGrid } from "@/components/meta-grid";
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

/** 達成か進捗かを示す、カード右上のピル。 */
function StatusPill({ label, isDone }: { label: string; isDone: boolean }) {
  return (
    <View
      className={cn(
        "h-7 px-3 rounded-full items-center justify-center",
        isDone ? "bg-success" : "bg-surface-tertiary",
      )}
    >
      <Text
        className={cn(
          "text-xs font-medium",
          isDone ? "text-success-foreground" : "text-foreground",
        )}
      >
        {label}
      </Text>
    </View>
  );
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
  const isDone = post.completionId !== null;

  return (
    <View className="bg-surface rounded-3xl p-4 gap-4 mb-3">
      <View className="flex-row items-center gap-3">
        <Pressable
          className="flex-row items-center gap-3 flex-1 active:opacity-70"
          onPress={() =>
            router.push({ pathname: "/user/[userId]", params: { userId: post.authorId } })
          }
        >
          <Avatar name={post.authorName} imageUrl={post.authorImage} shape="squircle" />
          <View className="flex-1">
            <Text className="text-foreground font-semibold" numberOfLines={1}>
              {post.authorName}
            </Text>
            <Text className="text-muted text-xs" numberOfLines={1}>
              {formatWhen(post.completedAt ?? post.createdAt)}
            </Text>
          </View>
        </Pressable>

        <StatusPill
          label={
            post.completionParticipants.length > 1
              ? `共同達成 ${post.completionParticipants.length}人`
              : isDone
                ? "達成"
                : "進捗"
          }
          isDone={isDone}
        />
      </View>

      <Pressable
        className="gap-3 active:opacity-70"
        onPress={() =>
          router.push({ pathname: "/mission/[missionId]", params: { missionId: post.missionId } })
        }
      >
        <Text className="text-foreground text-lg font-medium" numberOfLines={2}>
          {post.missionTitle}
        </Text>

        <MetaGrid
          items={[
            { label: "登録した人", value: post.missionCreatorName },
            { label: "一緒に達成", value: others.length ? `${others.length}人` : "なし" },
            { label: "タグ", value: post.missionTags[0] ?? "なし" },
          ]}
        />
      </Pressable>

      {post.mediaType === "photo" && post.mediaUrl ? (
        <Image
          source={{ uri: post.mediaUrl }}
          className="w-full h-64 rounded-3xl"
          resizeMode="cover"
        />
      ) : null}

      {post.mediaType === "video" && post.mediaUrl ? (
        <View className="w-full h-40 rounded-3xl bg-surface-tertiary items-center justify-center gap-2">
          <Ionicons name="play-circle" size={40} color={mutedColor} />
          <Text className="text-muted text-xs px-6 text-center" numberOfLines={1}>
            {post.mediaUrl}
          </Text>
        </View>
      ) : null}

      {post.caption ? (
        <Text className="text-foreground text-sm leading-5">{post.caption}</Text>
      ) : null}

      <View className="h-px bg-separator opacity-40" />

      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-xs" numberOfLines={1}>
          {others.length ? `一緒に: ${others.map((row) => row.name).join("・")}` : "個人の記録"}
        </Text>

        <Pressable
          className="flex-row items-center gap-1.5 active:opacity-60"
          onPress={() => toggleReaction.mutate({ postId: post.id })}
        >
          <Ionicons
            name={post.reactedByMe ? "heart" : "heart-outline"}
            size={20}
            color={post.reactedByMe ? dangerColor : mutedColor}
          />
          <Text className="text-muted text-sm">{post.reactionCount}</Text>
        </Pressable>
      </View>
    </View>
  );
}
