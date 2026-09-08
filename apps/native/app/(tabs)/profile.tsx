import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Input, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { ListEmpty, ListPanel, ListRow } from "@/components/list-panel";
import { formatWhen } from "@/components/post-card";
import { HeaderIconButton, ScreenHeader } from "@/components/screen-header";
import { StatPills } from "@/components/stat-pills";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

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
    <Container hasFloatingTabBar scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <ScreenHeader
        title={me.data?.name ?? "プロフィール"}
        eyebrow="プロフィール"
        actions={
          <>
            <HeaderIconButton
              icon="pencil"
              isActive={isEditingName}
              onPress={() => {
                setName(me.data?.name ?? "");
                setIsEditingName((value) => !value);
              }}
            />
            <ThemeToggle />
          </>
        }
      >
        <StatPills
          stats={[
            { label: "達成", value: `${me.data?.completedCount ?? 0}`, isHighlighted: true },
            { label: "参加中", value: `${me.data?.participatingCount ?? 0}` },
            { label: "登録した数", value: `${mine.data?.length ?? 0}` },
          ]}
        />
      </ScreenHeader>

      <View className="px-5 gap-3">
        {isEditingName ? (
          <View className="bg-surface rounded-3xl p-4 gap-3">
            <TextField>
              <Input value={name} onChangeText={setName} placeholder="アカウント名" />
            </TextField>
            <View className="flex-row gap-2">
              <Button
                size="sm"
                isDisabled={!name.trim() || updateName.isPending}
                onPress={() => updateName.mutate({ name: name.trim() })}
              >
                <Button.Label>保存</Button.Label>
              </Button>
              <Button size="sm" variant="secondary" onPress={() => setIsEditingName(false)}>
                <Button.Label>キャンセル</Button.Label>
              </Button>
            </View>
          </View>
        ) : (
          <View className="bg-surface rounded-3xl p-4 flex-row items-center gap-4">
            <Avatar name={me.data?.name ?? "?"} size="lg" shape="squircle" />
            <View className="flex-1 gap-0.5">
              <Text className="text-foreground text-xl font-medium" numberOfLines={1}>
                {me.data?.name}
              </Text>
              <Text className="text-muted text-xs">
                達成 {me.data?.completedCount} ・ 参加中 {me.data?.participatingCount}
              </Text>
            </View>
          </View>
        )}

        <ListPanel title="やりたいこと" count={`${mine.data?.length ?? 0}件`}>
          {mine.isLoading ? <Spinner size="sm" /> : null}

          {!mine.isLoading && (mine.data?.length ?? 0) === 0 ? (
            <ListEmpty>まだ登録していません。作成タブから登録してみよう。</ListEmpty>
          ) : null}

          {mine.data?.map((item) => (
            <ListRow
              key={item.missionId}
              icon="flag"
              title={item.title}
              subtitle={`参加 ${item.participantCount}人・達成 ${item.completionCount}件`}
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

        <ListPanel title="参加している" count={`${joined.length}件`}>
          {joined.length === 0 ? (
            <ListEmpty>ホームで気になるやりたいことを見つけて参加しよう。</ListEmpty>
          ) : null}

          {joined.map((item) => (
            <ListRow
              key={item.missionId}
              icon="people"
              title={item.title}
              subtitle={`登録: ${item.creatorName}`}
              trailing={`自分の達成 ${item.myCompletionCount}`}
              onPress={() =>
                router.push({
                  pathname: "/mission/[missionId]",
                  params: { missionId: item.missionId },
                })
              }
            />
          ))}
        </ListPanel>

        <ListPanel title="達成したこと" count={`${completions.data?.length ?? 0}件`}>
          {(completions.data?.length ?? 0) === 0 ? (
            <ListEmpty>まだ達成の記録はありません。</ListEmpty>
          ) : null}

          {completions.data?.map((item) => (
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

        <Button
          variant="secondary"
          className="mt-1"
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
