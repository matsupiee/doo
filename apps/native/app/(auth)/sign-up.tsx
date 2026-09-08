import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Wordmark } from "@/components/ig/wordmark";
import { SignUp } from "@/components/sign-up";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32 }}
      >
        <View className="items-center pb-6">
          <Wordmark size={60} />
          <Text className="text-muted text-[13px] text-center mt-2">
            登録して、みんなのやりたいことを見よう。
          </Text>
        </View>

        <SignUp />
      </ScrollView>

      <View
        className="flex-row justify-center gap-1 border-t border-border py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text className="text-muted text-[13px]">アカウントをお持ちですか？</Text>
        <Link href="/sign-in" replace className="text-[13px] font-semibold" style={{ color: "#0095f6" }}>
          ログイン
        </Link>
      </View>
    </View>
  );
}
