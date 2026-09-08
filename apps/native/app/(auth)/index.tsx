import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Wordmark } from "@/components/ig/wordmark";

/** アプリを開いたときの入口。新規登録とログインのどちらかを選ぶ。 */
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background px-10" style={{ paddingBottom: insets.bottom }}>
      <View className="flex-1 items-center justify-center gap-3">
        <Wordmark size={72} />
        <Text className="text-muted text-[14px] text-center">
          やりたいことを登録して、達成したら投稿する。
        </Text>
      </View>

      <View className="gap-3 pb-6">
        <Pressable
          className="items-center justify-center rounded-lg py-3 active:opacity-80"
          style={{ backgroundColor: "#0095f6" }}
          onPress={() => router.push("/sign-up")}
        >
          <Text className="text-white text-[14px] font-semibold">アカウントを作る</Text>
        </Pressable>
        <Pressable
          className="items-center justify-center rounded-lg border border-border py-3 active:opacity-70"
          onPress={() => router.push("/sign-in")}
        >
          <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
            ログイン
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
