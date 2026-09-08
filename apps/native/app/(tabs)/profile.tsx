import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Input, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatWhen } from "@/components/post-card";
import { TagChips } from "@/components/tag-chips";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { RoundIconButton } from "@/components/ui/icon-button";
import { Panel, PanelEyebrow, PanelMutedText, PanelText, PanelTitle } from "@/components/ui/panel";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatTile } from "@/components/ui/stat-tile";
import { toneForKey } from "@/components/ui/theme";
import { useAppTheme } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

/** 見出しと本文だけの節。プロフィールの一覧をまとめる。 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-foreground" style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState("");

  const me = useQuery(trpc.user.me.queryOptions());
  const mine = useQuery(trpc.mission.mine.queryOptions());
  const participating = useQuery(trpc.mission.participating.queryOptions());
  const completions = useQuery(trpc.user.myCompletions.queryOptions({ limit: 20 }));

  const updateName = useMutation(
    trpc.user.updateName.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        setIsEditingName(false);
        toast.show({ variant: "success", label: "アカウント名を更新しました" });
      },
      onError: (error) => toast.show({ variant: "danger", label: error.message }),
    }),
  );

  if (me.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  /** 自分が作ったものは「やりたいこと」に出すので、参加中からは外す。 */
  const joined = (participating.data ?? []).filter((item) => !item.isCreator);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="プロフィール" eyebrow="MY DOO" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 110,
          gap: 12,
        }}
      >
        <Panel tone="violet" className="p-5 gap-4">
          {isEditingName ? (
            <View className="gap-3">
              <TextField>
                <Input value={name} onChangeText={setName} placeholder="アカウント名" />
              </TextField>
              <View className="flex-row gap-2">
                <ActionButton
                  label="保存"
                  size="sm"
                  variant="outline"
                  isDisabled={!name.trim()}
                  isPending={updateName.isPending}
                  onPress={() => updateName.mutate({ name: name.trim() })}
                />
                <ActionButton
                  label="キャンセル"
                  size="sm"
                  variant="outline"
                  onPress={() => setIsEditingName(false)}
                />
              </View>
            </View>
          ) : (
            <View className="flex-row items-center gap-3">
              <Avatar
                name={me.data?.name ?? "?"}
                imageUrl={me.data?.image}
                seed={me.data?.id ?? "me"}
                size={56}
              />
              <View className="flex-1">
                <PanelEyebrow>ACCOUNT</PanelEyebrow>
                <PanelTitle size={26} numberOfLines={1}>
                  {me.data?.name}
                </PanelTitle>
              </View>
              <RoundIconButton
                name="pencil"
                variant="outline"
                onPress={() => {
                  setName(me.data?.name ?? "");
                  setIsEditingName(true);
                }}
              />
            </View>
          )}
        </Panel>

        <View className="flex-row gap-2">
          <StatTile label="達成" value={me.data?.completedCount ?? 0} tone="coral" />
          <StatTile label="参加中" value={me.data?.participatingCount ?? 0} tone="yellow" />
        </View>

        <Section title="やりたいこと">
          {mine.isLoading ? <Spinner size="sm" /> : null}

          {!mine.isLoading && (mine.data?.length ?? 0) === 0 ? (
            <Panel className="p-4">
              <PanelMutedText>まだ登録していません。作成タブから登録してみよう。</PanelMutedText>
            </Panel>
          ) : null}

          {mine.data?.map((item) => (
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
                  <PanelMutedText>
                    参加 {item.participantCount}人・達成 {item.completionCount}件・
                    {formatWhen(item.createdAt)}
                  </PanelMutedText>
                </View>
                <RoundIconButton name="arrow-forward" size={32} />
              </View>
              {item.tags.length ? <TagChips tags={item.tags} /> : null}
            </Panel>
          ))}
        </Section>

        <Section title="参加しているやりたいこと">
          {joined.length === 0 ? (
            <Panel className="p-4">
              <PanelMutedText>ホームで気になるやりたいことを見つけて参加しよう。</PanelMutedText>
            </Panel>
          ) : null}

          {joined.map((item) => (
            <Panel
              key={item.missionId}
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
                  <PanelTitle size={18}>{item.title}</PanelTitle>
                  <PanelMutedText>
                    登録: {item.creatorName}・自分の達成 {item.myCompletionCount}件
                  </PanelMutedText>
                </View>
                <RoundIconButton name="arrow-forward" size={32} />
              </View>
              {item.tags.length ? <TagChips tags={item.tags} /> : null}
            </Panel>
          ))}
        </Section>

        <Section title="達成したこと">
          {(completions.data?.length ?? 0) === 0 ? (
            <Panel className="p-4">
              <PanelMutedText>まだ達成の記録はありません。</PanelMutedText>
            </Panel>
          ) : null}

          {completions.data?.map((item) => (
            <Panel key={item.completionId} tone={isDark ? "cream" : "ink"} className="p-4 gap-1">
              <PanelEyebrow>COMPLETED</PanelEyebrow>
              <PanelTitle size={18}>{item.missionTitle}</PanelTitle>
              <PanelMutedText>
                {item.participants.length > 1
                  ? `${item.participants.map((row) => row.name).join("・")} と共同達成`
                  : "個人達成"}
                ・{formatWhen(item.completedAt)}
              </PanelMutedText>
              {item.caption ? (
                <PanelText style={{ marginTop: 4 }}>{item.caption}</PanelText>
              ) : null}
            </Panel>
          ))}
        </Section>

        <ActionButton
          label="サインアウト"
          variant="outline"
          onPress={() => {
            authClient.signOut();
            queryClient.clear();
          }}
        />
      </ScrollView>
    </View>
  );
}
