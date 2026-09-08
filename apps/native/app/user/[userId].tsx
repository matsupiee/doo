import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Spinner } from "heroui-native";
import { Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { CompletionRow } from "@/components/completion-row";
import { Container } from "@/components/container";
import { MissionCard } from "@/components/mission-card";
import { Pill } from "@/components/pill";
import { formatWhen } from "@/components/post-card";
import { RoundIconButton } from "@/components/round-icon-button";
import { SectionTitle } from "@/components/section-title";
import { cardShadow } from "@/theme/tones";
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
      <Container className="px-5" isScrollable={false}>
        <RoundIconButton
          name="chevron-back"
          variant="surface"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
        />
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-extrabold">このユーザーは見つかりません</Text>
        </View>
      </Container>
    );
  }

  const { user, missions, completions } = profile.data;

  return (
    <Container className="px-5">
      <View className="gap-7 pt-2">
        <RoundIconButton
          name="chevron-back"
          variant="surface"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
        />

        <View className="gap-4">
          <View className="flex-row items-center gap-4">
            <Avatar name={user.name} image={user.image} size={72} />
            <View className="flex-1 shrink">
              <Text
                className="text-foreground text-[28px] font-extrabold leading-9"
                numberOfLines={1}
              >
                {user.name}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <Pill label={`やりたいこと ${missions.length}件`} variant="solid" />
            <Pill label={`達成 ${completions.length}件`} />
          </View>
        </View>

        <View className="gap-3">
          <SectionTitle title="やりたいこと" />

          {missions.length === 0 ? (
            <View className="bg-surface rounded-[22px] p-5" style={cardShadow}>
              <Text className="text-muted text-sm">まだ登録していません。</Text>
            </View>
          ) : null}

          {missions.map((item) => (
            <MissionCard
              key={item.missionId}
              missionId={item.missionId}
              title={item.title}
              subtitle={formatWhen(item.createdAt)}
              tags={item.tags}
              onPress={() =>
                router.push({
                  pathname: "/mission/[missionId]",
                  params: { missionId: item.missionId },
                })
              }
            />
          ))}
        </View>

        <View className="gap-3">
          <SectionTitle title="達成したこと" />

          {completions.length === 0 ? (
            <View className="bg-surface rounded-[22px] p-5" style={cardShadow}>
              <Text className="text-muted text-sm">まだ達成の記録はありません。</Text>
            </View>
          ) : null}

          {completions.map((item) => (
            <CompletionRow
              key={item.completionId}
              toneKey={item.missionId}
              title={item.missionTitle}
              subtitle={`${
                item.participants.length > 1
                  ? `${item.participants.map((row) => row.name).join("・")} と共同達成`
                  : "個人達成"
              }・${formatWhen(item.completedAt)}`}
              caption={item.caption}
            />
          ))}
        </View>
      </View>
    </Container>
  );
}
