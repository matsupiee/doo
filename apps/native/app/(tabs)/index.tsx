import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Spinner } from "heroui-native";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilterChips } from "@/components/filter-chips";
import { FLOATING_TAB_BAR_HEIGHT } from "@/components/floating-tab-bar";
import { PostCard, type FeedPost } from "@/components/post-card";
import { ScreenHeader } from "@/components/screen-header";
import { StatPills } from "@/components/stat-pills";
import { ThemeToggle } from "@/components/theme-toggle";
import { trpc } from "@/utils/trpc";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const me = useQuery(trpc.user.me.queryOptions());

  /** 固定のカテゴリ一覧ではなく、実際に使われているタグを並べる。 */
  const tagOptions = useQuery(trpc.feed.tags.queryOptions());

  const feed = useInfiniteQuery(
    trpc.feed.list.infiniteQueryOptions(
      { limit: 20, tags },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );

  const posts = (feed.data?.pages.flatMap((page) => page.items) ?? []) as FeedPost[];

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([feed.refetch(), tagOptions.refetch(), me.refetch()]);
    setIsRefreshing(false);
  }, [feed, tagOptions, me]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="みんなの記録" eyebrow="doo" actions={<ThemeToggle />}>
        <StatPills
          stats={[
            { label: "自分の達成", value: `${me.data?.completedCount ?? 0}`, isHighlighted: true },
            { label: "参加中", value: `${me.data?.participatingCount ?? 0}` },
            { label: "絞り込み", value: tags.length ? `${tags.length}個` : "なし" },
          ]}
        />
      </ScreenHeader>

      <FilterChips
        options={(tagOptions.data ?? []).map((option) => option.title)}
        selected={tags}
        onToggle={(value) =>
          setTags((current) =>
            current.includes(value)
              ? current.filter((tag) => tag !== value)
              : [...current, value],
          )
        }
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + 40,
          flexGrow: 1,
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          feed.isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Spinner />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-2 px-8">
              <Text className="text-5xl">🫥</Text>
              <Text className="text-foreground font-semibold text-lg">まだ投稿がありません</Text>
              <Text className="text-muted text-sm text-center">
                {tags.length
                  ? "このタグの投稿はまだありません。"
                  : "やりたいことを登録して、達成したら投稿しよう。"}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View className="py-6">
              <Spinner />
            </View>
          ) : null
        }
      />
    </View>
  );
}
