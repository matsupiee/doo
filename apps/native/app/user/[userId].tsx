import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Card, Spinner } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { formatWhen } from "@/components/post-card";
import { TagChips } from "@/components/tag-chips";
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
      <Container className="px-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-semibold">このユーザーは見つかりません</Text>
        </View>
      </Container>
    );
  }

  const { user, missions, completions } = profile.data;

  return (
    <Container className="px-4" scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <View className="gap-4 py-4">
        <Card variant="secondary" className="p-4 flex-row items-center gap-3">
          <View className="w-14 h-14 rounded-full bg-accent items-center justify-center">
            <Text className="text-foreground text-xl font-bold">
              {user.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">{user.name}</Text>
            <Text className="text-muted text-xs">
              やりたいこと {missions.length}件・達成 {completions.length}件
            </Text>
          </View>
        </Card>

        <View className="gap-3">
          <Text className="text-foreground text-lg font-semibold">やりたいこと</Text>

          {missions.length === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">まだ登録していません。</Text>
            </Card>
          ) : null}

          {missions.map((item) => (
            <Pressable
              key={item.missionId}
              className="active:opacity-70"
              onPress={() =>
                router.push({
                  pathname: "/mission/[missionId]",
                  params: { missionId: item.missionId },
                })
              }
            >
              <Card variant="secondary" className="p-4 gap-1">
                <Text className="text-foreground font-semibold">🎯 {item.title}</Text>
                {item.tags.length ? (
                  <View className="mt-1">
                    <TagChips tags={item.tags} />
                  </View>
                ) : null}
                <Text className="text-muted text-xs">{formatWhen(item.createdAt)}</Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <View className="gap-3 pb-8">
          <Text className="text-foreground text-lg font-semibold">達成したこと</Text>

          {completions.length === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">まだ達成の記録はありません。</Text>
            </Card>
          ) : null}

          {completions.map((item) => (
            <Card key={item.completionId} variant="secondary" className="p-4 gap-1">
              <Text className="text-foreground font-semibold">🎯 {item.missionTitle}</Text>
              <Text className="text-muted text-xs">
                {item.participants.length > 1
                  ? `${item.participants.map((row) => row.name).join("・")} と共同達成`
                  : "個人達成"}
                ・{formatWhen(item.completedAt)}
              </Text>
              {item.caption ? (
                <Text className="text-foreground text-sm mt-1">{item.caption}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      </View>
    </Container>
  );
}
