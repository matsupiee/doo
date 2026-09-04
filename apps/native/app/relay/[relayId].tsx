import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Card, Chip, Spinner, useThemeColor } from "heroui-native";
import { Image, Text, View } from "react-native";

import { Container } from "@/components/container";

import { trpc } from "@/utils/trpc";

const statusLabel = {
  pending: "挑戦中",
  cleared: "達成",
  declined: "辞退",
} as const;

const pickedByLabel = {
  self: "起点",
  nominated: "指名",
  random: "ランダム",
} as const;

export default function RelayScreen() {
  const { relayId } = useLocalSearchParams<{ relayId: string }>();
  const successColor = useThemeColor("success");
  const mutedColor = useThemeColor("muted");

  const relay = useQuery(trpc.relay.get.queryOptions({ relayId }));

  if (relay.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (!relay.data) {
    return (
      <Container className="px-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">リレーが見つかりません。</Text>
        </View>
      </Container>
    );
  }

  const { relay: info, nodes } = relay.data;

  return (
    <Container className="px-4">
      <View className="gap-4 py-4">
        <Card variant="secondary" className="p-4 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-foreground text-lg font-semibold">
              🎯 {info.missionTitle}
            </Text>
            <Chip variant="secondary" color={info.status === "open" ? "success" : "default"} size="sm">
              <Chip.Label>{info.status === "open" ? "進行中" : "終了"}</Chip.Label>
            </Chip>
          </View>
          {info.missionDescription ? (
            <Text className="text-muted text-sm">{info.missionDescription}</Text>
          ) : null}
          <Text className="text-muted text-xs mt-1">
            {info.starterName} が開始・1人あたり最大 {info.maxNominations} 人指名・
            {nodes.length} 人が参加
          </Text>
        </Card>

        <View className="gap-3 pb-8">
          {nodes.map((node) => (
            <View
              key={node.assignmentId}
              style={{ marginLeft: Math.min(node.depth, 6) * 14 }}
              className="flex-row gap-3"
            >
              <View className="items-center pt-1">
                <Ionicons
                  name={node.status === "cleared" ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={node.status === "cleared" ? successColor : mutedColor}
                />
                <View className="flex-1 w-px bg-border mt-1" />
              </View>

              <Card variant="secondary" className="flex-1 p-3 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text className="flex-1 text-foreground font-medium">{node.assigneeName}</Text>
                  <Text className="text-muted text-xs">
                    {node.depth + 1}人目・{pickedByLabel[node.pickedBy]}
                  </Text>
                </View>
                <Text className="text-muted text-xs">{statusLabel[node.status]}</Text>

                {node.mediaType === "photo" && node.mediaUrl ? (
                  <Image
                    source={{ uri: node.mediaUrl }}
                    className="w-full h-40 rounded-lg mt-1"
                    resizeMode="cover"
                  />
                ) : null}

                {node.caption ? (
                  <Text className="text-foreground text-sm mt-1">{node.caption}</Text>
                ) : null}

                {node.status === "cleared" && node.relayHandoff === "ended" ? (
                  <Text className="text-muted text-xs mt-1">ここでチェーンを止めました</Text>
                ) : null}
              </Card>
            </View>
          ))}
        </View>
      </View>
    </Container>
  );
}
