import { Spinner } from "heroui-native";
import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";

/** Everything in doo is tied to an account, so the whole app sits behind this. */
export function AuthGate({ children }: PropsWithChildren) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (!session?.user) {
    return (
      <Container className="px-6">
        <View className="py-10 gap-2">
          <Text className="text-4xl font-bold text-foreground">doo</Text>
          <Text className="text-muted">
            ミッションを渡して、クリアして、次の誰かにつなげる。
          </Text>
        </View>
        <View className="gap-4 pb-10">
          <SignIn />
          <SignUp />
        </View>
      </Container>
    );
  }

  return <>{children}</>;
}
