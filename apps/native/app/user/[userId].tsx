import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Spinner } from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ig/avatar";
import { EmptyState } from "@/components/ig/empty-state";
import { MissionRow } from "@/components/ig/mission-row";
import { PostGrid } from "@/components/ig/post-grid";
import { ProfileStats } from "@/components/ig/profile-stats";
import { ProfileTabs } from "@/components/ig/profile-tabs";
import { formatWhen } from "@/components/post-card";
import { trpc } from "@/utils/trpc";

/** 他の人のプロフィール。登録したやりたいことを見て、そこから参加できる。 */
export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [tab, setTab] = useState<"grid" | "missions">("grid");

  const profile = useQuery(trpc.user.profile.queryOptions({ userId }));

  if (profile.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (!profile.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground font-semibold">このユーザーは見つかりません</Text>
      </View>
    );
  }

  const { user, missions, completions } = profile.data;

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Instagram はナビゲーションバーにユーザー名を出す */}
      <Stack.Screen options={{ title: user.name }} />

      <View className="flex-row items-center px-4 pt-4 pb-3 gap-6">
        <Avatar name={user.name} uri={user.image} size={88} hasRing={completions.length > 0} />
        <ProfileStats
          stats={[
            { label: "達成", value: completions.length },
            { label: "やりたいこと", value: missions.length },
          ]}
        />
      </View>

      <View className="px-4 pb-3">
        <Text className="text-foreground text-[13px] font-semibold">{user.name}</Text>
        <Text className="text-foreground text-[13px]">
          {completions.length
            ? `やりたいことを ${completions.length} 回達成しました。`
            : "まだ達成の記録はありません。"}
        </Text>
      </View>

      <View className="px-4 pb-4">
        <Pressable
          className="items-center justify-center rounded-lg bg-surface-tertiary py-2 active:opacity-70"
          onPress={() => setTab("missions")}
        >
          <Text className="text-foreground text-[13px] font-semibold">
            やりたいことを見て参加する
          </Text>
        </Pressable>
      </View>

      <ProfileTabs value={tab} onChange={setTab} />

      {tab === "grid" ? (
        completions.length ? (
          <PostGrid items={completions} />
        ) : (
          <EmptyState
            icon="trophy-outline"
            title="まだ達成がありません"
            body="このユーザーの達成はまだ投稿されていません。"
          />
        )
      ) : missions.length ? (
        <View>
          {missions.map((item) => (
            <MissionRow
              key={item.missionId}
              missionId={item.missionId}
              title={item.title}
              tags={item.tags}
              subtitle={formatWhen(item.createdAt)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="flag-outline"
          title="まだ登録していません"
          body="このユーザーはまだやりたいことを登録していません。"
        />
      )}
    </ScrollView>
  );
}
