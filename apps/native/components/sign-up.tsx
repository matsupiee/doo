import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, Spinner, TextField, useToast } from "heroui-native";
import { useRef } from "react";
import { TextInput, View } from "react-native";
import z from "zod";

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
                  <TextField>
                    <Label>名前</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder="やまだ たろう"
                      autoComplete="name"
                      textContentType="name"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        emailInputRef.current?.focus();
                      }}
                    />
                  </TextField>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <TextField>
                    <Label>メールアドレス</Label>
                    <Input
                      ref={emailInputRef}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder="email@example.com"
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
                  </TextField>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <TextField>
                    <Label>パスワード</Label>
                    <Input
                      ref={passwordInputRef}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder="••••••••"
                      secureTextEntry
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="go"
                      onSubmitEditing={form.handleSubmit}
                    />
                  </TextField>
                )}
              </form.Field>

              <Button onPress={form.handleSubmit} isDisabled={isSubmitting} className="mt-2">
                {isSubmitting ? (
                  <Spinner size="sm" color="default" />
                ) : (
                  <Button.Label>新規登録</Button.Label>
                )}
              </Button>
            </View>
          </>
        );
      }}
    </form.Subscribe>
  );
}
