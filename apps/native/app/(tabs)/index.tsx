import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Spinner } from "heroui-native";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { Pill } from "@/components/pill";
import { PostCard, type FeedPost } from "@/components/post-card";
import { Greeting, ScreenHeader } from "@/components/screen-header";
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
    await Promise.all([feed.refetch(), tagOptions.refetch()]);
    setIsRefreshing(false);
  }, [feed, tagOptions]);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-5">
            <PostCard post={item} />
          </View>
        )}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 108,
          gap: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-5">
            <View className="px-5">
              <ScreenHeader
                eyebrow={<Greeting name={me.data?.name ?? "you"} />}
                title={"今日は\nなにを達成する？"}
                right={<Avatar name={me.data?.name ?? "?"} image={me.data?.image} size={48} />}
              />
            </View>

            {tagOptions.data?.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                <Pill
                  label="すべて"
                  variant={tags.length === 0 ? "solid" : "muted"}
                  onPress={() => setTags([])}
                />
                {tagOptions.data.map((option) => (
                  <Pill
                    key={option.title}
                    label={option.title}
                    variant={tags.includes(option.title) ? "solid" : "muted"}
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
          </View>
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          feed.isLoading ? (
            <View className="flex-1 items-center justify-center py-16">
              <Spinner />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-2 px-10 py-16">
              <Text className="text-5xl">🫥</Text>
              <Text className="text-foreground font-extrabold text-lg">まだ投稿がありません</Text>
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
