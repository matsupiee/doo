import { useForm } from "@tanstack/react-form";
import { FieldError, useToast } from "heroui-native";
import { useRef } from "react";
import { TextInput, View } from "react-native";
import z from "zod";

import { IgButton, IgField } from "@/components/ig/field";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage, getErrorMessage } from "@/lib/form-errors";
import { queryClient } from "@/utils/trpc";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .min(8, "パスワードは8文字以上で入力してください"),
});

function SignIn() {
  const passwordInputRef = useRef<TextInput>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.signIn.email(
        {
          email: value.email.trim(),
          password: value.password,
        },
        {
          onError(error) {
            toast.show({
              variant: "danger",
              label: getAuthErrorMessage(error.error, "ログインに失敗しました"),
            });
          },
          onSuccess() {
            formApi.reset();
            toast.show({
              variant: "success",
              label: "ログインしました",
            });
            queryClient.refetchQueries();
          },
        },
      );
    },
  });

  return (
    <form.Subscribe
      selector={(state) => ({
        isSubmitting: state.isSubmitting,
        validationError: getErrorMessage(state.errorMap.onSubmit),
      })}
    >
      {({ isSubmitting, validationError }) => {
        const formError = validationError;

        return (
          <>
            <FieldError isInvalid={!!formError} className="mb-3">
              {formError}
            </FieldError>

            <View className="gap-3">
              <form.Field name="email">
                {(field) => (
                  <IgField
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    placeholder="メールアドレス"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      passwordInputRef.current?.focus();
                    }}
                  />
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <IgField
                    ref={passwordInputRef}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    placeholder="パスワード"
                    secureTextEntry
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={form.handleSubmit}
                  />
                )}
              </form.Field>

              <View className="mt-1">
                <IgButton
                  label="ログイン"
                  onPress={form.handleSubmit}
                  isDisabled={isSubmitting}
                  isPending={isSubmitting}
                />
              </View>
            </View>
          </>
        );
      }}
    </form.Subscribe>
  );
}

export { SignIn };
