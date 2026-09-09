import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Sheet, SheetMenuItem } from "@/components/ig/sheet";
import { trpc } from "@/utils/trpc";

type Step = "menu" | "complete";

/**
 * 作成の入口はここ 1 つだけ。ホームのヘッダーにある ＋ を押すと
 * 「やりたいことの登録」と「達成」が下から出てくる。
 * 達成は対象のやりたいことを選ばないと決まらないので、シートを開いたまま
 * 参加しているやりたいことの一覧に差し替える（モーダルは重ねない）。
 */
export function CreateMenuButton() {
  const foreground = useThemeColor("foreground");
  const [step, setStep] = useState<Step | null>(null);

  const missions = useQuery({
    ...trpc.mission.participating.queryOptions(),
    enabled: step === "complete",
  });

  function close() {
    setStep(null);
  }

  function openCreate() {
    close();
    router.push("/create");
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="作成"
        hitSlop={8}
        className="active:opacity-50"
        onPress={() => setStep("menu")}
      >
        <Ionicons name="add-circle-outline" size={26} color={foreground} />
      </Pressable>

      <Sheet
        isVisible={step !== null}
        onClose={close}
        title={step === "complete" ? "どれを達成した？" : "作成"}
        isScrollable={step === "complete"}
      >
        {step === "complete" ? (
          <CompletionTargets
            missions={missions.data}
            isLoading={missions.isLoading}
            onCreate={openCreate}
            onSelect={(missionId) => {
              close();
              router.push({
                pathname: "/mission/[missionId]",
                params: { missionId, compose: "1" },
              });
            }}
          />
        ) : (
          <>
            <SheetMenuItem label="やりたいことの登録" icon="flag-outline" onPress={openCreate} />
            <SheetMenuItem
              label="達成"
              icon="trophy-outline"
              onPress={() => setStep("complete")}
            />
          </>
        )}
      </Sheet>
    </>
  );
}

type Mission = {
  missionId: string;
  title: string;
  creatorName: string;
  isCreator: boolean;
  participantCount: number;
};

/** 達成を投稿する先を選ぶ一覧。参加しているものだけが投稿できる。 */
function CompletionTargets({
  missions,
  isLoading,
  onSelect,
  onCreate,
}: {
  missions: Mission[] | undefined;
  isLoading: boolean;
  onSelect: (missionId: string) => void;
  onCreate: () => void;
}) {
  if (isLoading) {
    return (
      <View className="items-center py-12">
        <Spinner />
      </View>
    );
  }

  if (!missions?.length) {
    return (
      <View className="items-center gap-2 px-10 py-12">
        <Text className="text-foreground text-[15px] font-semibold">
          参加しているやりたいことがありません
        </Text>
        <Text className="text-muted text-[13px] text-center">
          先にやりたいことを登録すると、達成として投稿できます。
        </Text>
        <Pressable className="mt-1 active:opacity-60" onPress={onCreate}>
          <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
            やりたいことを登録する
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      {missions.map((item) => (
        <Pressable
          key={item.missionId}
          className="flex-row items-center gap-3 px-4 py-3 active:opacity-60"
          onPress={() => onSelect(item.missionId)}
        >
          <View className="w-11 h-11 rounded-full bg-surface-tertiary items-center justify-center">
            <Ionicons name="flag" size={20} color="#8e8e8e" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-[15px]" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-muted text-[12px]">
              {item.isCreator ? "自分が登録" : `${item.creatorName} が登録`}・参加{" "}
              {item.participantCount}人
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#8e8e8e" />
        </Pressable>
      ))}
    </>
  );
}
