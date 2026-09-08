import { Link, router } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { RoundIconButton } from "@/components/round-icon-button";
import { ScreenHeader } from "@/components/screen-header";
import { SignUp } from "@/components/sign-up";
import { cardShadow } from "@/theme/tones";

export default function SignUpScreen() {
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
          eyebrow={<Text className="text-muted text-lg">新規登録</Text>}
          title={"アカウントを作る"}
        />

        <View className="bg-surface rounded-[26px] p-5" style={cardShadow}>
          <SignUp />
        </View>

        <View className="flex-row justify-center gap-1">
          <Text className="text-muted">アカウントをお持ちですか？</Text>
          <Link href="/sign-in" replace className="text-accent font-extrabold">
            ログイン
          </Link>
        </View>
      </View>
    </Container>
  );
}
