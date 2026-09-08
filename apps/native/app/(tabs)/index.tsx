import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Spinner } from "heroui-native";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard, type FeedPost } from "@/components/post-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Pill } from "@/components/ui/pill";
import { ScreenHeader } from "@/components/ui/screen-header";
import { trpc } from "@/utils/trpc";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

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
    await Promise.all([feed.refetch(), tagOptions.refetch()]);
    setIsRefreshing(false);
  }, [feed, tagOptions]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="みんなの投稿" eyebrow="DOO FEED" right={<ThemeToggle />} />

      {tagOptions.data?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
          className="grow-0"
        >
          {tagOptions.data.map((option) => (
            <Pill
              key={option.title}
              label={option.title}
              isSelected={tags.includes(option.title)}
              onPress={() =>
                setTags((current) =>
                  current.includes(option.title)
                    ? current.filter((value) => value !== option.title)
                    : [...current, option.title],
                )
              }
            />
          ))}
        </ScrollView>
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: insets.bottom + 96,
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
