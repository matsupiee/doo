import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";

export default function SignUpScreen() {
  return (
    <Container className="px-6">
      <View className="py-6 gap-2">
        <Text className="text-2xl font-bold text-foreground">アカウントを作る</Text>
        <Text className="text-muted">メールアドレスで doo をはじめる。</Text>
      </View>

      <SignUp />

      <View className="flex-row justify-center gap-1 py-8">
        <Text className="text-muted">アカウントをお持ちですか？</Text>
        <Link href="/sign-in" replace className="text-foreground font-medium">
          ログイン
        </Link>
      </View>
    </Container>
  );
}
