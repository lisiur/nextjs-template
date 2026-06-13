"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@repo/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { appClient, withApiFeedback } from "@/lib/api";

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
}: {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}) {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");

  const loginSchema = z.object({
    email: z.string().min(1, tc("required", { field: tc("email") })),
    password: z.string().min(1, tc("required", { field: tc("password") })),
  });

  type LoginInput = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    await withApiFeedback(appClient.api.auth["sign-in"].email.$post, {
      showError: false,
    })({
      json: data,
    });
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">{tc("email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">{tc("password")}</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="********"
            {...register("password")}
          />
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" className="w-full">
        {t("signIn")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary underline-offset-4 hover:underline"
        >
          {t("createOne")}
        </button>
      </p>
    </form>
  );
}
