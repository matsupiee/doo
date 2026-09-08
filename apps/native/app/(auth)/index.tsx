import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pill } from "@/components/pill";
import { brandColors, cardShadow } from "@/theme/tones";

/** アプリを開いたときの入口。濃い面いっぱいの見出しと、丸いはじめるボタンだけ置く。 */
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background px-4"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
    >
      <View
        className="flex-1 rounded-[36px] p-8 justify-between"
        style={[{ backgroundColor: brandColors.ink }, cardShadow]}
      >
        <View className="flex-1 justify-center gap-7">
          <Text className="text-white text-[32px] font-extrabold leading-[44px]">
            {"やりたいことを、\nみんなで\n達成しよう。"}
          </Text>
          <Text className="text-[16px] leading-7" style={{ color: brandColors.onInk }}>
            登録して、参加して、達成したら投稿する。それだけのアプリです。
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <Pill label="ひとりでも" variant="light" color={brandColors.ink} />
            <Pill label="みんなでも" variant="light" color={brandColors.ink} />
            <Pill label="何度でも" variant="light" color={brandColors.ink} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="新規登録へ進む"
            className="active:opacity-80 mt-2"
            onPress={() => router.push("/sign-up")}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: brandColors.sun }}
            >
              <Ionicons name="arrow-forward" size={30} color={brandColors.ink} />
            </View>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-center gap-2">
          <Text style={{ color: brandColors.onInk }}>アカウントをお持ちですか？</Text>
          <Pressable onPress={() => router.push("/sign-in")} className="active:opacity-70">
            <Text className="text-white font-extrabold">ログイン</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
