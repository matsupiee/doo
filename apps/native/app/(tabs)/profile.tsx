import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Input, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { CompletionRow } from "@/components/completion-row";
import { Container } from "@/components/container";
import { MissionCard } from "@/components/mission-card";
import { Pill } from "@/components/pill";
import { formatWhen } from "@/components/post-card";
import { RoundIconButton } from "@/components/round-icon-button";
import { SectionTitle } from "@/components/section-title";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { cardShadow } from "@/theme/tones";
import { queryClient, trpc } from "@/utils/trpc";

/** 一覧が空のときに出す、白い面のひとこと。 */
function EmptyNote({ children }: { children: string }) {
  return (
    <View className="bg-surface rounded-[22px] p-5" style={cardShadow}>
      <Text className="text-muted text-sm">{children}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { toast } = useToast();
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
    <Container className="px-5" hasTabBar>
      <View className="gap-7 pt-2">
        <View className="gap-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-lg">プロフィール</Text>
            <ThemeToggle />
          </View>

          {isEditingName ? (
            <View className="bg-surface rounded-[26px] p-5 gap-3" style={cardShadow}>
              <TextField>
                <Input value={name} onChangeText={setName} placeholder="アカウント名" />
              </TextField>
              <View className="flex-row gap-2">
                <Button
                  className="rounded-full flex-1"
                  isDisabled={!name.trim() || updateName.isPending}
                  onPress={() => updateName.mutate({ name: name.trim() })}
                >
                  <Button.Label>保存</Button.Label>
                </Button>
                <Button
                  className="rounded-full flex-1"
                  variant="secondary"
                  onPress={() => setIsEditingName(false)}
                >
                  <Button.Label>キャンセル</Button.Label>
                </Button>
              </View>
            </View>
          ) : (
            <View className="gap-4">
              <View className="flex-row items-center gap-4">
                <Avatar name={me.data?.name ?? "?"} image={me.data?.image} size={72} />
                <View className="flex-1 shrink">
                  <Text
                    className="text-foreground text-[28px] font-extrabold leading-9"
                    numberOfLines={1}
                  >
                    {me.data?.name}
                  </Text>
                  <Text className="text-muted text-sm" numberOfLines={1}>
                    {me.data?.email}
                  </Text>
                </View>
                <RoundIconButton
                  name="pencil"
                  variant="surface"
                  size={40}
                  accessibilityLabel="アカウント名を変える"
                  onPress={() => {
                    setName(me.data?.name ?? "");
                    setIsEditingName(true);
                  }}
                />
              </View>

              <View className="flex-row gap-2">
                <Pill label={`達成 ${me.data?.completedCount ?? 0}件`} variant="solid" />
                <Pill label={`参加中 ${me.data?.participatingCount ?? 0}件`} />
              </View>
            </View>
          )}
        </View>

        <View className="gap-3">
          <SectionTitle title="やりたいこと" />

          {mine.isLoading ? <Spinner size="sm" /> : null}

          {!mine.isLoading && (mine.data?.length ?? 0) === 0 ? (
            <EmptyNote>まだ登録していません。作成タブから登録してみよう。</EmptyNote>
          ) : null}

          {mine.data?.map((item) => (
            <MissionCard
              key={item.missionId}
              missionId={item.missionId}
              title={item.title}
              subtitle={formatWhen(item.createdAt)}
              tags={item.tags}
              stats={[`参加 ${item.participantCount}人`, `達成 ${item.completionCount}件`]}
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
          <SectionTitle title="参加しているやりたいこと" />

          {joined.length === 0 ? (
            <EmptyNote>ホームで気になるやりたいことを見つけて参加しよう。</EmptyNote>
          ) : null}

          {joined.map((item) => (
            <MissionCard
              key={item.missionId}
              missionId={item.missionId}
              title={item.title}
              subtitle={`登録: ${item.creatorName}`}
              tags={item.tags}
              stats={[`自分の達成 ${item.myCompletionCount}件`]}
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

          {(completions.data?.length ?? 0) === 0 ? (
            <EmptyNote>まだ達成の記録はありません。</EmptyNote>
          ) : null}

          {completions.data?.map((item) => (
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

        <Button
          className="rounded-full h-14"
          variant="secondary"
          onPress={() => {
            authClient.signOut();
            queryClient.clear();
          }}
        >
          <Button.Label>サインアウト</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
