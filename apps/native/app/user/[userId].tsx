import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Spinner } from "heroui-native";
import { Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { ListEmpty, ListPanel, ListRow } from "@/components/list-panel";
import { formatWhen } from "@/components/post-card";
import { ScreenHeader } from "@/components/screen-header";
import { StatPills } from "@/components/stat-pills";
import { trpc } from "@/utils/trpc";

/** 他の人のプロフィール。登録したやりたいことを見て、そこから参加できる。 */
export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
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
      <Container>
        <ScreenHeader title="プロフィール" hasBackButton />
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-semibold">このユーザーは見つかりません</Text>
        </View>
      </Container>
    );
  }

  const { user, missions, completions } = profile.data;

  return (
    <Container scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <ScreenHeader title={user.name} eyebrow="プロフィール" hasBackButton>
        <StatPills
          stats={[
            { label: "達成", value: `${completions.length}`, isHighlighted: true },
            { label: "やりたいこと", value: `${missions.length}` },
          ]}
        />
      </ScreenHeader>

      <View className="px-5 gap-3 pb-8">
        <View className="bg-surface rounded-3xl p-4 flex-row items-center gap-4">
          <Avatar name={user.name} size="lg" shape="squircle" />
          <View className="flex-1 gap-0.5">
            <Text className="text-foreground text-xl font-medium" numberOfLines={1}>
              {user.name}
            </Text>
            <Text className="text-muted text-xs">
              やりたいこと {missions.length}件・達成 {completions.length}件
            </Text>
          </View>
        </View>

        <ListPanel title="やりたいこと" count={`${missions.length}件`}>
          {missions.length === 0 ? <ListEmpty>まだ登録していません。</ListEmpty> : null}

          {missions.map((item) => (
            <ListRow
              key={item.missionId}
              icon="flag"
              title={item.title}
              subtitle={item.tags.length ? item.tags.join("・") : undefined}
              trailing={formatWhen(item.createdAt)}
              onPress={() =>
                router.push({
                  pathname: "/mission/[missionId]",
                  params: { missionId: item.missionId },
                })
              }
            />
          ))}
        </ListPanel>

        <ListPanel title="達成したこと" count={`${completions.length}件`}>
          {completions.length === 0 ? <ListEmpty>まだ達成の記録はありません。</ListEmpty> : null}

          {completions.map((item) => (
            <ListRow
              key={item.completionId}
              icon="checkmark-circle"
              title={item.missionTitle}
              subtitle={
                item.participants.length > 1
                  ? `${item.participants.map((row) => row.name).join("・")} と共同達成`
                  : (item.caption ?? "個人達成")
              }
              trailing={formatWhen(item.completedAt)}
            />
          ))}
        </ListPanel>
      </View>
    </Container>
  );
}
