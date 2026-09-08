import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { Pill } from "@/components/pill";
import { brandColors, cardShadow, inkOnWhite, toneStyleFor } from "@/theme/tones";
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

/**
 * フィードの1件。やりたいことごとに色が決まった塗りの面にして、
 * 写真やひとことはその上の白い面に置く。
 */
export function PostCard({ post }: { post: FeedPost }) {
  const tone = toneStyleFor(post.missionId);

  const toggleReaction = useMutation(
    trpc.feed.toggleReaction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.feed.list.queryKey() });
      },
    }),
  );

  const others = post.completionParticipants.filter((row) => row.userId !== post.authorId);

  return (
    <View
      className="rounded-[28px] p-5 gap-4"
      style={[{ backgroundColor: tone.background }, cardShadow]}
    >
      <View className="flex-row items-center gap-3">
        <Link href={{ pathname: "/user/[userId]", params: { userId: post.authorId } }} asChild>
          <Pressable className="flex-row items-center gap-3 flex-1 active:opacity-70">
            <Avatar name={post.authorName} image={post.authorImage} size={40} />
            <View className="flex-1">
              <Text className="font-extrabold text-base" style={{ color: tone.foreground }}>
                {post.authorName}
              </Text>
              <Text className="text-xs" style={{ color: tone.mutedForeground }}>
                {post.completionId ? "達成" : "進捗"}・
                {formatWhen(post.completedAt ?? post.createdAt)}
              </Text>
            </View>
          </Pressable>
        </Link>

        <Pressable
          className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="この投稿に反応する"
          onPress={() => toggleReaction.mutate({ postId: post.id })}
        >
          <Ionicons
            name={post.reactedByMe ? "heart" : "heart-outline"}
            size={18}
            color={post.reactedByMe ? brandColors.heart : inkOnWhite}
          />
          <Text className="text-[13px] font-extrabold" style={{ color: inkOnWhite }}>
            {post.reactionCount}
          </Text>
        </Pressable>
      </View>

      <Pressable
        className="gap-1 active:opacity-80"
        onPress={() =>
          router.push({
            pathname: "/mission/[missionId]",
            params: { missionId: post.missionId },
          })
        }
      >
        <Text className="text-[24px] font-extrabold leading-8" style={{ color: tone.foreground }}>
          {post.missionTitle}
        </Text>
        <Text className="text-sm" style={{ color: tone.mutedForeground }}>
          登録: {post.missionCreatorName}
          {others.length ? `・一緒に達成: ${others.map((row) => row.name).join("・")}` : ""}
        </Text>
      </Pressable>

      {post.mediaType === "photo" && post.mediaUrl ? (
        <Image
          source={{ uri: post.mediaUrl }}
          className="w-full h-60 rounded-[20px]"
          resizeMode="cover"
        />
      ) : null}

      {post.mediaType === "video" && post.mediaUrl ? (
        <View className="w-full h-40 rounded-[20px] bg-white items-center justify-center gap-2">
          <Ionicons name="play-circle" size={48} color={tone.onWhite} />
          <Text className="text-xs px-6 text-center" numberOfLines={1} style={{ color: inkOnWhite }}>
            {post.mediaUrl}
          </Text>
        </View>
      ) : null}

      {post.caption ? (
        <View className="rounded-[20px] bg-white p-4">
          <Text className="text-[15px] leading-6" style={{ color: inkOnWhite }}>
            {post.caption}
          </Text>
        </View>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        {post.completionParticipants.length > 1 ? (
          <Pill label={`共同達成 ${post.completionParticipants.length}人`} variant="light" />
        ) : null}
        {post.missionTags.slice(0, 4).map((tag) => (
          <Pill key={tag} label={`#${tag}`} variant="light" color={tone.onWhite} />
        ))}
      </View>
    </View>
  );
}
