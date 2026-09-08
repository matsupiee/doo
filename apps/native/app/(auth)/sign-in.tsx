import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { ScreenHeader } from "@/components/screen-header";
import { SignIn } from "@/components/sign-in";

export default function SignInScreen() {
  return (
    <Container scrollViewProps={{ showsVerticalScrollIndicator: false }}>
      <ScreenHeader title="おかえりなさい" eyebrow="ログイン" hasBackButton />

      <View className="px-5 gap-3">
        <Text className="text-muted text-sm">メールアドレスとパスワードでログイン。</Text>

        <View className="bg-surface rounded-3xl p-4">
          <SignIn />
        </View>

        <View className="flex-row justify-center gap-1 py-6">
          <Text className="text-muted">アカウントがありませんか？</Text>
          <Link href="/sign-up" replace className="text-foreground font-medium">
            新規登録
          </Link>
        </View>
      </View>
    </Container>
  );
}
