import { useForm } from "@tanstack/react-form";
import { FieldError, useToast } from "heroui-native";
import { useRef } from "react";
import { TextInput, View } from "react-native";
import z from "zod";

import { IgButton, IgField } from "@/components/ig/field";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage, getErrorMessage } from "@/lib/form-errors";
import { queryClient } from "@/utils/trpc";

const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "名前を入力してください")
    .min(2, "名前は2文字以上で入力してください"),
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

export function SignUp() {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.signUp.email(
        {
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
        },
        {
          onError(error) {
            toast.show({
              variant: "danger",
              label: getAuthErrorMessage(error.error, "新規登録に失敗しました"),
            });
          },
          onSuccess() {
            formApi.reset();
            toast.show({
              variant: "success",
              label: "アカウントを作成しました",
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
              <form.Field name="name">
                {(field) => (
                  <IgField
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    placeholder="名前"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      emailInputRef.current?.focus();
                    }}
                  />
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <IgField
                    ref={emailInputRef}
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
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={form.handleSubmit}
                  />
                )}
              </form.Field>

              <View className="mt-1">
                <IgButton
                  label="登録する"
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
