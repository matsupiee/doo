import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { Button, Card, Chip, Input, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { formatWhen } from "@/components/post-card";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

const pickedByLabel = {
  self: "自分で受けた",
  nominated: "指名",
  random: "ランダム",
} as const;

export default function ProfileScreen() {
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState("");

  const me = useQuery(trpc.user.me.queryOptions());
  const inbox = useQuery(trpc.mission.inbox.queryOptions());
  const sent = useQuery(trpc.mission.sent.queryOptions());

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

  const decline = useMutation(
    trpc.mission.decline.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
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
                  達成 {me.data?.clearedCount} ・ 進行中 {me.data?.pendingCount}
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
          <Text className="text-foreground text-lg font-semibold">来ているミッション</Text>

          {inbox.isLoading ? <Spinner size="sm" /> : null}

          {!inbox.isLoading && (inbox.data?.length ?? 0) === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">
                いまは空っぽ。誰かからの依頼を待つか、自分でミッションを作ってみよう。
              </Text>
            </Card>
          ) : null}

          {inbox.data?.map((item) => (
            <Card key={item.assignmentId} variant="secondary" className="p-4 gap-2">
              <View className="flex-row items-start gap-2">
                <Text className="flex-1 text-foreground text-base font-semibold">
                  🎯 {item.title}
                </Text>
                {item.relayId ? (
                  <Chip variant="secondary" color="success" size="sm">
                    <Chip.Label>リレー</Chip.Label>
                  </Chip>
                ) : null}
              </View>

              {item.description ? (
                <Text className="text-muted text-sm">{item.description}</Text>
              ) : null}

              <Text className="text-muted text-xs">
                {item.assignerName ? `${item.assignerName} から` : "自分で受けた"}・
                {pickedByLabel[item.pickedBy]}・{formatWhen(item.createdAt)}
              </Text>

              <View className="flex-row gap-2 mt-1">
                <Button
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: "/mission/[assignmentId]",
                      params: { assignmentId: item.assignmentId },
                    })
                  }
                >
                  <Button.Label>達成を投稿</Button.Label>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={decline.isPending}
                  onPress={() => decline.mutate({ assignmentId: item.assignmentId })}
                >
                  <Button.Label>やらない</Button.Label>
                </Button>
              </View>
            </Card>
          ))}
        </View>

        <View className="gap-3 pb-8">
          <Text className="text-foreground text-lg font-semibold">出したミッション</Text>

          {(sent.data?.length ?? 0) === 0 ? (
            <Card variant="secondary" className="p-4">
              <Text className="text-muted text-sm">まだ誰にもミッションを渡していません。</Text>
            </Card>
          ) : null}

          {sent.data?.map((item) => (
            <Card key={item.missionId} variant="secondary" className="p-4 gap-1">
              <Text className="text-foreground font-semibold">🎯 {item.title}</Text>
              <Text className="text-muted text-xs">
                {Number(item.cleared ?? 0)} / {Number(item.total ?? 0)} 人が達成
              </Text>
              {item.relayId ? (
                <Link
                  href={{ pathname: "/relay/[relayId]", params: { relayId: item.relayId } }}
                  className="text-success text-xs mt-1"
                >
                  リレーの続きを見る →
                </Link>
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
