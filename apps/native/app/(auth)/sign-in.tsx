import { Link, router } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { RoundIconButton } from "@/components/round-icon-button";
import { ScreenHeader } from "@/components/screen-header";
import { SignIn } from "@/components/sign-in";
import { cardShadow } from "@/theme/tones";

export default function SignInScreen() {
  return (
    <Container className="px-5">
      <View className="gap-7 pt-2">
        <RoundIconButton
          name="chevron-back"
          variant="surface"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
        />

        <ScreenHeader
          eyebrow={<Text className="text-muted text-lg">ログイン</Text>}
          title={"おかえりなさい"}
        />

        <View className="bg-surface rounded-[26px] p-5" style={cardShadow}>
          <SignIn />
        </View>

        <View className="flex-row justify-center gap-1">
          <Text className="text-muted">アカウントがありませんか？</Text>
          <Link href="/sign-up" replace className="text-accent font-extrabold">
            新規登録
          </Link>
        </View>
      </View>
    </Container>
  );
}
