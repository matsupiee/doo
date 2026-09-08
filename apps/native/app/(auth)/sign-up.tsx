import { Link, router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignUp } from "@/components/sign-up";
import { Panel, PanelEyebrow, PanelMutedText, PanelTitle } from "@/components/ui/panel";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="新規登録" eyebrow="GET STARTED" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      >
        <Panel tone="coral" className="p-5 gap-1">
          <PanelEyebrow>SIGN UP</PanelEyebrow>
          <PanelTitle size={24}>アカウントを作る</PanelTitle>
          <PanelMutedText style={{ fontSize: 13, marginTop: 4 }}>
            メールアドレスで doo をはじめる。
          </PanelMutedText>
        </Panel>

        <Panel className="p-4">
          <SignUp />
        </Panel>

        <View className="flex-row justify-center gap-1 py-4">
          <Text className="text-muted">アカウントをお持ちですか？</Text>
          <Link href="/sign-in" replace className="text-foreground font-medium">
            ログイン
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}
