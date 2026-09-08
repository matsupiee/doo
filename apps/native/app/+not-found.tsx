import { Stack, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { EmptyState } from "@/components/ig/empty-state";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "ページが見つかりません" }} />
      <View className="flex-1 items-center justify-center bg-background">
        <EmptyState
          icon="help-outline"
          title="ページが見つかりません"
          body="お探しのページは削除されたか、URL が変わった可能性があります。"
        />
        <Pressable className="active:opacity-60" onPress={() => router.replace("/")}>
          <Text className="text-[14px] font-semibold" style={{ color: "#0095f6" }}>
            ホームに戻る
          </Text>
        </Pressable>
      </View>
    </>
  );
}
