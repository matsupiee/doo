import { Link, router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignIn } from "@/components/sign-in";
import { Panel, PanelEyebrow, PanelMutedText, PanelTitle } from "@/components/ui/panel";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="ログイン" eyebrow="WELCOME BACK" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      >
        <Panel tone="violet" className="p-5 gap-1">
          <PanelEyebrow>SIGN IN</PanelEyebrow>
          <PanelTitle size={24}>おかえりなさい</PanelTitle>
          <PanelMutedText style={{ fontSize: 13, marginTop: 4 }}>
            メールアドレスとパスワードでログイン。
          </PanelMutedText>
        </Panel>

        <Panel className="p-4">
          <SignIn />
        </Panel>

        <View className="flex-row justify-center gap-1 py-4">
          <Text className="text-muted">アカウントがありませんか？</Text>
          <Link href="/sign-up" replace className="text-foreground font-medium">
            新規登録
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}
