import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Spinner } from "heroui-native";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatWhen } from "@/components/post-card";
import { TagChips } from "@/components/tag-chips";
import { Avatar } from "@/components/ui/avatar";
import { RoundIconButton } from "@/components/ui/icon-button";
import { Panel, PanelEyebrow, PanelMutedText, PanelText, PanelTitle } from "@/components/ui/panel";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatTile } from "@/components/ui/stat-tile";
import { toneForKey } from "@/components/ui/theme";
import { useAppTheme } from "@/contexts/app-theme-context";
import { trpc } from "@/utils/trpc";

/** 他の人のプロフィール。登録したやりたいことを見て、そこから参加できる。 */
export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
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
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <ScreenHeader title="プロフィール" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground font-semibold">このユーザーは見つかりません</Text>
        </View>
      </View>
    );
  }

  const { user, missions, completions } = profile.data;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={user.name} eyebrow="PROFILE" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      >
        <Panel tone="violet" className="p-5 flex-row items-center gap-3">
          <Avatar name={user.name} imageUrl={user.image} seed={user.id} size={56} />
          <View className="flex-1">
            <PanelEyebrow>ACCOUNT</PanelEyebrow>
            <PanelTitle size={26} numberOfLines={1}>
              {user.name}
            </PanelTitle>
          </View>
        </Panel>

        <View className="flex-row gap-2">
          <StatTile label="やりたいこと" value={missions.length} tone="yellow" />
          <StatTile label="達成" value={completions.length} tone="coral" />
        </View>

        <Text
          className="text-foreground"
          style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}
        >
          やりたいこと
        </Text>

        {missions.length === 0 ? (
          <Panel className="p-4">
            <PanelMutedText>まだ登録していません。</PanelMutedText>
          </Panel>
        ) : null}

        {missions.map((item) => (
          <Panel
            key={item.missionId}
            tone={toneForKey(item.missionId, isDark)}
            className="p-4 gap-2"
            onPress={() =>
              router.push({
                pathname: "/mission/[missionId]",
                params: { missionId: item.missionId },
              })
            }
          >
            <View className="flex-row items-start gap-3">
              <View className="flex-1 gap-1">
                <PanelTitle size={20}>{item.title}</PanelTitle>
                <PanelMutedText>{formatWhen(item.createdAt)}</PanelMutedText>
              </View>
              <RoundIconButton name="arrow-forward" size={32} />
            </View>
            {item.tags.length ? <TagChips tags={item.tags} /> : null}
          </Panel>
        ))}

        <Text
          className="text-foreground"
          style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}
        >
          達成したこと
        </Text>

        {completions.length === 0 ? (
          <Panel className="p-4">
            <PanelMutedText>まだ達成の記録はありません。</PanelMutedText>
          </Panel>
        ) : null}

        {completions.map((item) => (
          <Panel key={item.completionId} tone={isDark ? "cream" : "ink"} className="p-4 gap-1">
            <PanelEyebrow>COMPLETED</PanelEyebrow>
            <PanelTitle size={18}>{item.missionTitle}</PanelTitle>
            <PanelMutedText>
              {item.participants.length > 1
                ? `${item.participants.map((row) => row.name).join("・")} と共同達成`
                : "個人達成"}
              ・{formatWhen(item.completedAt)}
            </PanelMutedText>
            {item.caption ? <PanelText style={{ marginTop: 4 }}>{item.caption}</PanelText> : null}
          </Panel>
        ))}
      </ScrollView>
    </View>
  );
}
