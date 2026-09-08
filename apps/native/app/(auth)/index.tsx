import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";

/** アプリを開いたときの入口。新規登録とログインのどちらかを選ぶ。 */
export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <Container className="px-5" isScrollable={false}>
      <View className="flex-row justify-end pt-14">
        <ThemeToggle />
      </View>

      <View className="flex-1 justify-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-accent items-center justify-center">
          <Text className="text-accent-foreground text-2xl font-bold">d</Text>
        </View>
        <Text className="text-6xl font-light text-foreground">doo</Text>
        <Text className="text-lg text-muted leading-6">
          やりたいことを登録して、達成したら投稿する。
        </Text>
      </View>

      <View className="gap-3 pb-10">
        <Button onPress={() => router.push("/sign-up")}>
          <Button.Label>新規登録</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => router.push("/sign-in")}>
          <Button.Label>ログイン</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
