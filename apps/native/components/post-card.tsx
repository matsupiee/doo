import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useCallback, useRef } from "react";
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { backdropFor } from "@/components/ig/backdrop";
import { Gradient } from "@/components/ig/gradient";
import { Avatar } from "@/components/ig/avatar";
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
  const { width } = useWindowDimensions();
  const foreground = useThemeColor("foreground");
  const dangerColor = useThemeColor("danger");

  const heartScale = useSharedValue(0);
  const lastTapAt = useRef(0);

  const toggleReaction = useMutation(
    trpc.feed.toggleReaction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.feed.list.queryKey() });
      },
    }),
  );

  /** Instagram と同じく、写真のダブルタップでいいねを付ける（外すことはしない）。 */
  const onMediaTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapAt.current < 300) {
      lastTapAt.current = 0;
      heartScale.value = withSequence(
        withSpring(1, { damping: 12, stiffness: 220 }),
        withTiming(0, { duration: 350 }),
      );
      if (!post.reactedByMe) toggleReaction.mutate({ postId: post.id });
      return;
    }
    lastTapAt.current = now;
  }, [heartScale, post.id, post.reactedByMe, toggleReaction]);

  const burstStyle = useAnimatedStyle(() => ({
    opacity: heartScale.value,
    transform: [{ scale: 0.6 + heartScale.value * 0.5 }],
  }));

  const others = post.completionParticipants.filter((row) => row.userId !== post.authorId);
  const isCompletion = !!post.completionId;
  const backdrop = backdropFor(post.id);

  return (
    <View className="bg-background pb-1">
      {/* ヘッダー: アバター・ユーザー名・やりたいこと（Instagram の位置情報の行にあたる） */}
      <View className="flex-row items-center px-3 py-2 gap-3">
        <Link href={{ pathname: "/user/[userId]", params: { userId: post.authorId } }} asChild>
          <Pressable className="active:opacity-60">
            <Avatar name={post.authorName} uri={post.authorImage} size={38} hasRing={isCompletion} />
          </Pressable>
        </Link>

        <View className="flex-1">
          <Link href={{ pathname: "/user/[userId]", params: { userId: post.authorId } }} asChild>
            <Pressable className="active:opacity-60">
              <Text className="text-foreground text-[13px] font-semibold">{post.authorName}</Text>
            </Pressable>
          </Link>
          <Link
            href={{ pathname: "/mission/[missionId]", params: { missionId: post.missionId } }}
            asChild
          >
            <Pressable className="active:opacity-60">
              <Text className="text-foreground text-[12px]" numberOfLines={1}>
                {post.missionTitle}
              </Text>
            </Pressable>
          </Link>
        </View>

        <Pressable
          className="px-1 active:opacity-50"
          onPress={() =>
            router.push({
              pathname: "/mission/[missionId]",
              params: { missionId: post.missionId },
            })
          }
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={foreground} />
        </Pressable>
      </View>

      {/* メディア: Instagram と同じ正方形。テキスト投稿は色面に文字を置く */}
      <Pressable onPress={onMediaTap}>
        <View style={{ width, height: width }} className="bg-surface-tertiary">
          {post.mediaType === "photo" && post.mediaUrl ? (
            <Image
              source={{ uri: post.mediaUrl }}
              style={{ width, height: width }}
              resizeMode="cover"
            />
          ) : null}

          {post.mediaType === "video" && post.mediaUrl ? (
            <View
              style={{ width, height: width, backgroundColor: "#111" }}
              className="items-center justify-center"
            >
              <Ionicons name="play-circle" size={72} color="rgba(255,255,255,0.9)" />
            </View>
          ) : null}

          {post.mediaType === "text" || !post.mediaUrl ? (
            <Gradient
              colors={backdrop}
              style={{ width, height: width }}
              className="items-center justify-center px-10"
            >
              <Text
                className="text-white text-2xl font-semibold text-center"
                numberOfLines={6}
                style={{ lineHeight: 34 }}
              >
                {post.caption ?? post.missionTitle}
              </Text>
            </Gradient>
          ) : null}

          {/* 達成・進捗のしるし。Instagram のカルーセル表示と同じ右上の位置 */}
          <View className="absolute top-3 right-3 flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1">
            <Ionicons
              name={isCompletion ? "trophy" : "trending-up"}
              size={12}
              color="#fff"
            />
            <Text className="text-white text-[11px] font-semibold">
              {isCompletion ? "達成" : "進捗"}
            </Text>
          </View>

          {/* 共同達成は、Instagram のタグ付けと同じ左下のアイコンで示す */}
          {others.length ? (
            <View className="absolute bottom-3 left-3 flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1">
              <Ionicons name="people" size={12} color="#fff" />
              <Text className="text-white text-[11px]">{others.length + 1}人</Text>
            </View>
          ) : null}

          {/* ダブルタップで飛び出すハート */}
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <Animated.View style={burstStyle}>
              <Ionicons name="heart" size={96} color="rgba(255,255,255,0.92)" />
            </Animated.View>
          </View>
        </View>
      </Pressable>

      {/* アクション行 */}
      <View className="flex-row items-center px-3 pt-2.5 pb-1.5">
        <Pressable
          className="pr-4 active:opacity-50"
          onPress={() => toggleReaction.mutate({ postId: post.id })}
        >
          <Ionicons
            name={post.reactedByMe ? "heart" : "heart-outline"}
            size={26}
            color={post.reactedByMe ? dangerColor : foreground}
          />
        </Pressable>
        <Link
          href={{ pathname: "/mission/[missionId]", params: { missionId: post.missionId } }}
          asChild
        >
          <Pressable className="pr-4 active:opacity-50">
            <Ionicons name="chatbubble-outline" size={24} color={foreground} />
          </Pressable>
        </Link>
        <Ionicons name="paper-plane-outline" size={24} color={foreground} />

        <View className="flex-1" />
        <Ionicons name="bookmark-outline" size={24} color={foreground} />
      </View>

      {/* いいね数・キャプション・時刻 */}
      <View className="px-3 pb-3 gap-0.5">
        {post.reactionCount > 0 ? (
          <Text className="text-foreground text-[13px] font-semibold">
            いいね！{post.reactionCount}件
          </Text>
        ) : null}

        {post.caption ? (
          <Text className="text-foreground text-[13px]" style={{ lineHeight: 18 }}>
            <Text className="font-semibold">{post.authorName} </Text>
            {post.caption}
          </Text>
        ) : null}

        {others.length ? (
          <Text className="text-foreground text-[13px]">
            <Text className="text-muted">一緒に達成: </Text>
            {others.map((row) => row.name).join("、")}
          </Text>
        ) : null}

        {post.missionTags.length ? (
          <Text className="text-[13px]" style={{ color: "#0095f6" }}>
            {post.missionTags.map((tag) => `#${tag}`).join(" ")}
          </Text>
        ) : null}

        <Text className="text-muted text-[11px] mt-0.5">
          {formatWhen(post.completedAt ?? post.createdAt)}
        </Text>
      </View>
    </View>
  );
}
