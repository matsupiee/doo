import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Input, Spinner, TextField, useThemeColor, useToast } from "heroui-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ig/avatar";
import { EmptyState } from "@/components/ig/empty-state";
import { HighlightRail } from "@/components/ig/highlight-rail";
import { MissionRow } from "@/components/ig/mission-row";
import { PostGrid } from "@/components/ig/post-grid";
import { ProfileStats } from "@/components/ig/profile-stats";
import { ProfileTabs } from "@/components/ig/profile-tabs";
import { authClient } from "@/lib/auth-client";
import { useAppTheme } from "@/contexts/app-theme-context";
import { queryClient, trpc } from "@/utils/trpc";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { toggleTheme, isLight } = useAppTheme();
  const foreground = useThemeColor("foreground");

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState("");
  const [tab, setTab] = useState<"grid" | "missions">("grid");

  const me = useQuery(trpc.user.me.queryOptions());
  const mine = useQuery(trpc.mission.mine.queryOptions());
  const participating = useQuery(trpc.mission.participating.queryOptions());
  const completions = useQuery(trpc.user.myCompletions.queryOptions({ limit: 50 }));

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
  const myMissions = mine.data ?? [];

  function openMenu() {
    Alert.alert("設定", undefined, [
      {
        text: isLight ? "ダークモードにする" : "ライトモードにする",
        onPress: toggleTheme,
      },
      {
        text: "サインアウト",
        style: "destructive",
        onPress: () => {
          authClient.signOut();
          queryClient.clear();
        },
      },
      { text: "キャンセル", style: "cancel" },
    ]);
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Instagram のプロフィールヘッダー: ユーザー名が左、操作が右 */}
      <View className="flex-row items-center px-4 py-2.5 gap-1">
        <Text className="text-foreground text-[20px] font-bold">{me.data?.name}</Text>
        <View className="flex-1" />
        <Pressable className="px-2 active:opacity-50" onPress={() => router.push("/create")}>
          <Ionicons name="add-circle-outline" size={26} color={foreground} />
        </Pressable>
        <Pressable className="pl-2 active:opacity-50" onPress={openMenu}>
          <Ionicons name="menu" size={28} color={foreground} />
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
          <Text className="text-foreground text-[13px]">
            {me.data?.completedCount
              ? `やりたいことを ${me.data.completedCount} 回達成しました。`
              : "やりたいことを登録して、達成したら投稿しよう。"}
          </Text>
        </View>

        {isEditingName ? (
          <View className="px-4 pb-4 gap-2">
            <TextField>
              <Input value={name} onChangeText={setName} placeholder="アカウント名" autoFocus />
            </TextField>
            <View className="flex-row gap-2">
              <PillButton
                label="保存"
                variant="accent"
                isDisabled={!name.trim() || updateName.isPending}
                onPress={() => updateName.mutate({ name: name.trim() })}
              />
              <PillButton label="キャンセル" onPress={() => setIsEditingName(false)} />
            </View>
          </View>
        ) : (
          <View className="flex-row px-4 pb-4 gap-1.5">
            <PillButton
              label="プロフィールを編集"
              onPress={() => {
                setName(me.data?.name ?? "");
                setIsEditingName(true);
              }}
            />
            <PillButton label="やりたいことを登録" onPress={() => router.push("/create")} />
          </View>
        )}

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
                body="作成タブからやりたいことを登録してみよう。"
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
function PillButton({
  label,
  onPress,
  variant = "default",
  isDisabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "default" | "accent";
  isDisabled?: boolean;
}) {
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={`flex-1 items-center justify-center rounded-lg py-2 active:opacity-70 ${
        variant === "accent" ? "" : "bg-surface-tertiary"
      }`}
      style={[
        variant === "accent" ? { backgroundColor: "#0095f6" } : undefined,
        isDisabled ? { opacity: 0.5 } : undefined,
      ]}
    >
      <Text
        className={`text-[13px] font-semibold ${
          variant === "accent" ? "text-white" : "text-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
