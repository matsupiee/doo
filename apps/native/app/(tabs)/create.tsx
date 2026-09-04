import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  Spinner,
  TextField,
  useThemeColor,
  useToast,
} from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { UserPicker } from "@/components/user-picker";
import { MISSION_CATEGORIES, type MissionCategory } from "@/lib/mission-categories";
import { queryClient, trpc } from "@/utils/trpc";

const MAX_RECIPIENTS = 10;

export default function CreateMissionScreen() {
  const { toast } = useToast();
  const checkboxColor = useThemeColor("foreground");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofHint, setProofHint] = useState("");
  const [categories, setCategories] = useState<MissionCategory[]>([]);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [isRelay, setIsRelay] = useState(false);
  const [maxNominations, setMaxNominations] = useState(1);

  const createMission = useMutation(
    trpc.mission.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries();
        toast.show({
          variant: "success",
          label: result.assignmentCount
            ? `ミッションを${result.assignmentCount}人に渡しました`
            : "ミッションを作りました（まだ誰にも渡していません）",
        });
        setTitle("");
        setDescription("");
        setProofHint("");
        setCategories([]);
        setAssigneeIds([]);
        setAssignToSelf(false);
        setIsRelay(false);
        setMaxNominations(1);
        router.push("/profile");
      },
      onError: (error) => {
        toast.show({ variant: "danger", label: error.message });
      },
    }),
  );

  const hasRecipient = assignToSelf || assigneeIds.length > 0;
  // A relay needs a first runner; a plain mission can be created and handed out later.
  const canSubmit =
    title.trim().length > 0 && (!isRelay || hasRecipient) && !createMission.isPending;

  return (
    <Container className="px-4" scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <View className="gap-4 py-4">
        <Card variant="secondary" className="p-4 gap-3">
          <TextField>
            <Label>ミッション名</Label>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="例）パエリアを作ってみて"
              maxLength={80}
            />
          </TextField>

          <TextField>
            <Label>内容</Label>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="どんなミッション？ 制限やルールがあれば書こう"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{ minHeight: 88, textAlignVertical: "top" }}
            />
          </TextField>

          <TextField>
            <Label>達成の証明方法（任意）</Label>
            <Input
              value={proofHint}
              onChangeText={setProofHint}
              placeholder="例）完成した皿の写真を撮って"
              maxLength={200}
            />
          </TextField>
        </Card>

        <Card variant="secondary" className="p-4 gap-3">
          <Card.Title>カテゴリ（任意・複数可）</Card.Title>
          <View className="flex-row flex-wrap gap-2">
            {MISSION_CATEGORIES.map((option) => {
              const isSelected = categories.includes(option.value);
              return (
                // `Chip` is itself a Pressable, so it takes `onPress` directly —
                // wrapping it in another Pressable swallows the tap.
                <Chip
                  key={option.value}
                  variant={isSelected ? "primary" : "secondary"}
                  color={isSelected ? "success" : "default"}
                  onPress={() =>
                    setCategories((current) =>
                      current.includes(option.value)
                        ? current.filter((value) => value !== option.value)
                        : [...current, option.value],
                    )
                  }
                >
                  <Chip.Label>{option.label}</Chip.Label>
                </Chip>
              );
            })}
          </View>
        </Card>

        <Card variant="secondary" className="p-4 gap-3">
          <Card.Title>誰に渡す？（任意）</Card.Title>
          <Text className="text-muted text-xs">
            いま決まっていなければ空のままでOK。あとからプロフィールで渡せます。
          </Text>

          <Pressable
            onPress={() => setAssignToSelf((value) => !value)}
            className="flex-row items-center gap-3 active:opacity-70"
          >
            <Ionicons
              name={assignToSelf ? "checkbox" : "square-outline"}
              size={22}
              color={checkboxColor}
            />
            <Text className="text-foreground">自分にも渡す</Text>
          </Pressable>

          <UserPicker
            selectedIds={assigneeIds}
            onChange={setAssigneeIds}
            max={MAX_RECIPIENTS}
          />
        </Card>

        <Card variant="secondary" className="p-4 gap-3">
          <Pressable
            onPress={() => setIsRelay((value) => !value)}
            className="flex-row items-center gap-3 active:opacity-70"
          >
            <Ionicons name={isRelay ? "checkbox" : "square-outline"} size={22} color={checkboxColor} />
            <View className="flex-1">
              <Text className="text-foreground font-medium">リレーにする</Text>
              <Text className="text-muted text-xs">
                クリアした人が次の人を指名／ランダム指名して、チェーンをつなげられます。
              </Text>
            </View>
          </Pressable>

          {isRelay && !hasRecipient ? (
            <Text className="text-danger text-xs">
              リレーは最初に走る人が必要です。自分か誰かを選んでください。
            </Text>
          ) : null}

          {isRelay ? (
            <View className="gap-2">
              <Text className="text-foreground text-sm">1人が指名できる人数（最大10人）</Text>
              <View className="flex-row items-center gap-4">
                <Pressable
                  className="w-10 h-10 rounded-full bg-accent items-center justify-center active:opacity-70"
                  onPress={() => setMaxNominations((value) => Math.max(1, value - 1))}
                >
                  <Text className="text-foreground text-xl">−</Text>
                </Pressable>
                <Text className="text-foreground text-lg font-semibold w-8 text-center">
                  {maxNominations}
                </Text>
                <Pressable
                  className="w-10 h-10 rounded-full bg-accent items-center justify-center active:opacity-70"
                  onPress={() => setMaxNominations((value) => Math.min(10, value + 1))}
                >
                  <Text className="text-foreground text-xl">＋</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </Card>

        <Button
          isDisabled={!canSubmit}
          className="mb-8"
          onPress={() =>
            createMission.mutate({
              title: title.trim(),
              description: description.trim() || undefined,
              proofHint: proofHint.trim() || undefined,
              categories,
              assignToSelf,
              assigneeIds,
              relay: isRelay ? { enabled: true, maxNominations } : undefined,
            })
          }
        >
          {createMission.isPending ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>{hasRecipient ? "ミッションを渡す" : "ミッションを作る"}</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}
