import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Spinner } from "heroui-native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard, type FeedPost } from "@/components/post-card";
import { trpc } from "@/utils/trpc";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  /** タグ絞り込みはやめて、常に全件をそのまま流す。 */
  const feed = useInfiniteQuery(
    trpc.feed.list.infiniteQueryOptions(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );

  const posts = (feed.data?.pages.flatMap((page) => page.items) ?? []) as FeedPost[];

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await feed.refetch();
    setIsRefreshing(false);
  }, [feed]);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          feed.isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <Spinner />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-2 px-10 py-20">
              <View className="w-20 h-20 rounded-full border-2 border-foreground items-center justify-center">
                <Text className="text-3xl">📷</Text>
              </View>
              <Text className="text-foreground font-semibold text-[22px] mt-2">
                まだ投稿がありません
              </Text>
              <Text className="text-muted text-sm text-center">
                やりたいことを登録して、達成したら投稿しよう。
              </Text>
              <Pressable className="mt-2 active:opacity-60" onPress={() => router.push("/create")}>
                <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
                  やりたいことを登録する
                </Text>
              </Pressable>
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
