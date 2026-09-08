import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { ScreenHeader } from "@/components/screen-header";
import { SignUp } from "@/components/sign-up";

export default function SignUpScreen() {
  return (
    <Container scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <ScreenHeader title="アカウントを作る" eyebrow="新規登録" hasBackButton />

      <View className="px-5 gap-3">
        <Text className="text-muted text-sm">メールアドレスで doo をはじめる。</Text>

        <View className="bg-surface rounded-3xl p-4">
          <SignUp />
        </View>

        <View className="flex-row justify-center gap-1 py-6">
          <Text className="text-muted">アカウントをお持ちですか？</Text>
          <Link href="/sign-in" replace className="text-foreground font-medium">
            ログイン
          </Link>
        </View>
      </View>
    </Container>
  );
}
