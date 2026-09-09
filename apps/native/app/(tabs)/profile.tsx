import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ig/avatar";
import { CreateMenuButton } from "@/components/ig/create-menu";
import { EmptyState } from "@/components/ig/empty-state";
import { HighlightRail } from "@/components/ig/highlight-rail";
import { MissionRow } from "@/components/ig/mission-row";
import { PostGrid } from "@/components/ig/post-grid";
import { ProfileStats } from "@/components/ig/profile-stats";
import { ProfileTabs } from "@/components/ig/profile-tabs";
import { trpc } from "@/utils/trpc";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("foreground");

  const [tab, setTab] = useState<"grid" | "missions">("grid");

  const me = useQuery(trpc.user.me.queryOptions());
  const mine = useQuery(trpc.mission.mine.queryOptions());
  const participating = useQuery(trpc.mission.participating.queryOptions());
  const completions = useQuery(trpc.user.myCompletions.queryOptions({ limit: 50 }));

  if (me.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  /** 自分が作ったものは「やりたいこと」に出すので、参加中からは外す。 */
  const joined = (participating.data ?? []).filter((item) => !item.isCreator);
  const myMissions = mine.data ?? [];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* 作成の入口はここの左上の ＋、右上は設定への導線 */}
      <View className="flex-row items-center px-4 py-2.5">
        <CreateMenuButton />
        <View className="flex-1" />
        <Pressable className="pl-2 active:opacity-50" onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={26} color={foreground} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-4 pt-1 pb-3 gap-6">
          <Avatar name={me.data?.name ?? ""} uri={me.data?.image} size={88} hasRing />
          <ProfileStats
            stats={[
              { label: "達成", value: me.data?.completedCount ?? 0 },
              { label: "やりたいこと", value: myMissions.length },
              { label: "参加中", value: joined.length },
            ]}
          />
        </View>

        <View className="px-4 pb-3">
          <Text className="text-foreground text-[13px] font-semibold">{me.data?.name}</Text>
          {/* 自己紹介を書いていれば、Instagram と同じく名前のすぐ下に出す */}
          {me.data?.bio ? (
            <Text className="text-foreground text-[13px]" style={{ lineHeight: 18 }}>
              {me.data.bio}
            </Text>
          ) : null}
          <Text className="text-foreground text-[13px]">
            {me.data?.completedCount
              ? `やりたいことを ${me.data.completedCount} 回達成しました。`
              : "やりたいことを登録して、達成したら投稿しよう。"}
          </Text>
        </View>

        <View className="flex-row px-4 pb-4">
          <PillButton label="プロフィールを編集" onPress={() => router.push("/profile/edit")} />
        </View>

        {/* ハイライトの位置に、参加しているやりたいことを並べる */}
        <HighlightRail
          items={joined.map((item) => ({
            id: item.missionId,
            label: item.title,
            missionId: item.missionId,
          }))}
        />

        <ProfileTabs value={tab} onChange={setTab} />

        {tab === "grid" ? (
          completions.data?.length ? (
            <PostGrid items={completions.data} />
          ) : (
            <EmptyState
              icon="trophy-outline"
              title="まだ達成がありません"
              body="やりたいことを開いて、達成として投稿しよう。"
            />
          )
        ) : (
          <View>
            {myMissions.length === 0 ? (
              <EmptyState
                icon="flag-outline"
                title="まだ登録していません"
                body="左上の ＋ からやりたいことを登録してみよう。"
              />
            ) : (
              myMissions.map((item) => (
                <MissionRow
                  key={item.missionId}
                  missionId={item.missionId}
                  title={item.title}
                  tags={item.tags}
                  subtitle={`参加 ${item.participantCount}人・達成 ${item.completionCount}件`}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

/** Instagram のプロフィールにある、横に伸びる薄いグレーのボタン。 */
function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center rounded-lg bg-surface-tertiary py-2 active:opacity-70"
    >
      <Text className="text-foreground text-[13px] font-semibold">{label}</Text>
    </Pressable>
  );
}
