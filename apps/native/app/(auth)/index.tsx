import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

/** アプリを開いたときの入口。新規登録とログインのどちらかを選ぶ。 */
export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <Container className="px-6" isScrollable={false}>
      <View className="flex-1 justify-center gap-3">
        <Text className="text-5xl font-bold text-foreground">doo</Text>
        <Text className="text-lg text-muted">
          ミッションを渡して、クリアして、次の誰かにつなげる。
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
