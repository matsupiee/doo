import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Card, Input, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { formatWhen } from "@/components/post-card";
import { TagChips } from "@/components/tag-chips";
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
    <Container className="px-4" scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <View className="gap-4 py-4">
        <Card variant="secondary" className="p-4 gap-3">
          {isEditingName ? (
            <View className="gap-3">
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
            <View className="flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-full bg-accent items-center justify-center">
                <Text className="text-foreground text-xl font-bold">
                  {me.data?.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-2xl font-bold">{me.data?.name}</Text>
                <Text className="text-muted text-xs">
                  達成 {me.data?.completedCount} ・ 参加中 {me.data?.participatingCount}
                </Text>
              </View>
              <Pressable
                className="p-2 active:opacity-70"
                onPress={() => {
                  setName(me.data?.name ?? "");
                  setIsEditingName(true);
                }}
              >
                <Ionicons name="pencil" size={18} color="#888" />
              </Pressable>
            </View>
          )}
        </Card>

        <View className="gap-3">
          <Text className="text-foreground text-lg font-semibold">やりたいこと</Text>

          {mine.isLoading ? <Spinner size="sm" /> : null}

          {!mine.isLoading && (mine.data?.length ?? 0) === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">
                まだ登録していません。作成タブから登録してみよう。
              </Text>
            </Card>
          ) : null}

          {mine.data?.map((item) => (
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
                <Text className="text-muted text-xs">
                  参加 {item.participantCount}人・達成 {item.completionCount}件・
                  {formatWhen(item.createdAt)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <View className="gap-3">
          <Text className="text-foreground text-lg font-semibold">参加しているやりたいこと</Text>

          {joined.length === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">
                ホームで気になるやりたいことを見つけて参加しよう。
              </Text>
            </Card>
          ) : null}

          {joined.map((item) => (
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
                <Text className="text-muted text-xs">
                  登録: {item.creatorName}・自分の達成 {item.myCompletionCount}件
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <View className="gap-3 pb-8">
          <Text className="text-foreground text-lg font-semibold">達成したこと</Text>

          {(completions.data?.length ?? 0) === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">まだ達成の記録はありません。</Text>
            </Card>
          ) : null}

          {completions.data?.map((item) => (
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

          <Button
            variant="secondary"
            onPress={() => {
              authClient.signOut();
              queryClient.clear();
            }}
          >
            <Button.Label>サインアウト</Button.Label>
          </Button>
        </View>
      </View>
    </Container>
  );
}
