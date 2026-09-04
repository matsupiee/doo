import { useInfiniteQuery } from "@tanstack/react-query";
import { Chip, Spinner } from "heroui-native";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard, type FeedPost } from "@/components/post-card";
import { MISSION_CATEGORIES, type MissionCategory } from "@/lib/mission-categories";
import { trpc } from "@/utils/trpc";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState<MissionCategory[]>([]);

  const feed = useInfiniteQuery(
    trpc.feed.list.infiniteQueryOptions(
      { limit: 20, categories },
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        className="grow-0"
      >
        {MISSION_CATEGORIES.map((option) => {
          const isSelected = categories.includes(option.value);
          return (
            // `Chip` is itself a Pressable, so it takes `onPress` directly.
            <Chip
              key={option.value}
              variant={isSelected ? "primary" : "secondary"}
              color={isSelected ? "success" : "default"}
              size="sm"
              onPress={() =>
                setCategories((current) =>
                  current.includes(option.value)
                    ? current.filter((value) => value !== option.value)
                    : [...current, option.value],
                )
              }
            >
              <Chip.Label>{option.label}</Chip.Label>
            </Chip>
          );
        })}
      </ScrollView>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
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
              <Text className="text-foreground font-semibold text-lg">まだ達成がありません</Text>
              <Text className="text-muted text-sm text-center">
                {categories.length
                  ? "このカテゴリの達成はまだありません。"
                  : "誰かにミッションを渡すか、自分でチャレンジしてここを埋めよう。"}
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
