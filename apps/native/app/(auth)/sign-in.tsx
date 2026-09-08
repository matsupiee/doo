import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Wordmark } from "@/components/ig/wordmark";
import { SignIn } from "@/components/sign-in";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32 }}
      >
        <View className="items-center pb-8">
          <Wordmark size={60} />
        </View>

        <SignIn />

        <Text className="text-muted text-[12px] text-center pt-5">
          パスワードをお忘れですか？
        </Text>
      </ScrollView>

      {/* Instagram と同じく、切り替えの導線は画面の一番下に細い線で区切って置く */}
      <View
        className="flex-row justify-center gap-1 border-t border-border py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text className="text-muted text-[13px]">アカウントをお持ちでないですか？</Text>
        <Link href="/sign-up" replace className="text-[13px] font-semibold" style={{ color: "#0095f6" }}>
          登録する
        </Link>
      </View>
    </View>
  );
}
