import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

import { TagChips } from "@/components/tag-chips";
import { Avatar } from "@/components/ui/avatar";
import { RoundIconButton } from "@/components/ui/icon-button";
import {
  Panel,
  PanelEyebrow,
  PanelMutedText,
  PanelText,
  PanelTitle,
  useToneColors,
} from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { toneForKey } from "@/components/ui/theme";
import { useAppTheme } from "@/contexts/app-theme-context";
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

/** 面の色に合わせて色が変わるハートと数。 */
function ReactionButton({
  count,
  isReacted,
  onPress,
}: {
  count: number;
  isReacted: boolean;
  onPress: () => void;
}) {
  const colors = useToneColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.muted,
        backgroundColor: isReacted ? colors.foreground : "transparent",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons
        name={isReacted ? "heart" : "heart-outline"}
        size={16}
        color={isReacted ? colors.background : colors.foreground}
      />
      <Text
        style={{
          color: isReacted ? colors.background : colors.foreground,
          fontSize: 12,
          fontWeight: "700",
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

export function PostCard({ post }: { post: FeedPost }) {
  const { isDark } = useAppTheme();
  const tone = toneForKey(post.missionId, isDark);

  const toggleReaction = useMutation(
    trpc.feed.toggleReaction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.feed.list.queryKey() });
      },
    }),
  );

  const others = post.completionParticipants.filter((row) => row.userId !== post.authorId);

  return (
    <Panel tone={tone} className="mb-4 p-4 gap-3">
      <View className="flex-row items-center gap-3">
        <Pressable
          className="flex-row items-center gap-3 flex-1 active:opacity-70"
          onPress={() =>
            router.push({ pathname: "/user/[userId]", params: { userId: post.authorId } })
          }
        >
          <Avatar name={post.authorName} imageUrl={post.authorImage} seed={post.authorId} size={38} />
          <View className="flex-1">
            <PanelTitle size={15} numberOfLines={1}>
              {post.authorName}
            </PanelTitle>
            <PanelMutedText>
              {post.completionId ? "達成" : "進捗"}・{formatWhen(post.completedAt ?? post.createdAt)}
            </PanelMutedText>
          </View>
        </Pressable>

        <RoundIconButton
          name="arrow-forward"
          onPress={() =>
            router.push({ pathname: "/mission/[missionId]", params: { missionId: post.missionId } })
          }
        />
      </View>

      <Pressable
        className="active:opacity-70"
        onPress={() =>
          router.push({ pathname: "/mission/[missionId]", params: { missionId: post.missionId } })
        }
      >
        <PanelEyebrow>{post.completionId ? "COMPLETED" : "PROGRESS"}</PanelEyebrow>
        <PanelTitle size={24} style={{ marginTop: 2 }}>{post.missionTitle}</PanelTitle>
        <PanelMutedText style={{ marginTop: 4 }}>
          登録: {post.missionCreatorName}
          {others.length ? `・一緒に達成: ${others.map((row) => row.name).join("・")}` : ""}
        </PanelMutedText>
      </Pressable>

      {post.missionTags.length ? <TagChips tags={post.missionTags} /> : null}

      {post.mediaType === "photo" && post.mediaUrl ? (
        <Image
          source={{ uri: post.mediaUrl }}
          style={{ width: "100%", height: 260, borderRadius: 20 }}
          resizeMode="cover"
        />
      ) : null}

      {post.mediaType === "video" && post.mediaUrl ? (
        <VideoPlaceholder url={post.mediaUrl} />
      ) : null}

      {post.caption ? (
        <PanelText style={{ lineHeight: 20 }}>{post.caption}</PanelText>
      ) : null}

      <View className="flex-row items-center gap-2">
        <ReactionButton
          count={post.reactionCount}
          isReacted={post.reactedByMe}
          onPress={() => toggleReaction.mutate({ postId: post.id })}
        />
        {post.completionParticipants.length > 1 ? (
          <Pill label={`共同達成 ${post.completionParticipants.length}人`} size="sm" />
        ) : null}
      </View>
    </Panel>
  );
}

/** 動画はまだ再生しないので、面の色に馴染む枠だけ置く。 */
function VideoPlaceholder({ url }: { url: string }) {
  const colors = useToneColors();

  return (
    <View
      style={{
        width: "100%",
        height: 180,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: `${colors.foreground}1a`,
      }}
    >
      <Ionicons name="play-circle" size={44} color={colors.foreground} />
      <PanelMutedText numberOfLines={1} style={{ paddingHorizontal: 24 }}>
        {url}
      </PanelMutedText>
    </View>
  );
}
