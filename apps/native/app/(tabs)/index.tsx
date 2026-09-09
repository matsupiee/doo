import { useInfiniteQuery } from "@tanstack/react-query";
import { Spinner } from "heroui-native";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateMenuButton } from "@/components/ig/create-menu";
import { PostCard, type FeedPost } from "@/components/post-card";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/*
        ヘッダーは Tabs のものではなく画面の中に持つ。
        作成シートは Modal なので、ナビゲーションのヘッダーの中では出せない。
      */}
      <View
        className="flex-row items-center px-4 py-2.5 gap-4 border-b border-border"
        style={{ borderBottomWidth: 0.5 }}
      >
        {/* 作成の入口は左上の ＋ */}
        <CreateMenuButton />
        <View className="flex-1" />
        <ThemeToggle />
      </View>

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
                左上の ＋ からやりたいことを登録して、達成したら投稿しよう。
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
