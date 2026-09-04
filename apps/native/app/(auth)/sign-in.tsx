import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";

export default function SignInScreen() {
  return (
    <Container className="px-6">
      <View className="py-6 gap-2">
        <Text className="text-2xl font-bold text-foreground">おかえりなさい</Text>
        <Text className="text-muted">メールアドレスとパスワードでログイン。</Text>
      </View>

      <SignIn />

      <View className="flex-row justify-center gap-1 py-8">
        <Text className="text-muted">アカウントがありませんか？</Text>
        <Link href="/sign-up" replace className="text-foreground font-medium">
          新規登録
        </Link>
      </View>
    </Container>
  );
}
