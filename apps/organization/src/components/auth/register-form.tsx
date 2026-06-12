"use client";

import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@repo/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { appClient } from "@/lib/api";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

interface RegisterFormProps {
  onSuccess?: () => void | Promise<void>;
  onSwitchToLogin?: () => void;
}

function getErrorMessage(json: unknown) {
  if (typeof json === "object" && json !== null) {
    if ("message" in json && typeof json.message === "string") {
      return json.message;
    }
    if ("error" in json) {
      const { error } = json;
      if (typeof error === "string") return error;
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        return error.message;
      }
    }
  }

  return null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!name) nextErrors.name = tc("required", { field: tc("name") });
    if (!email) {
      nextErrors.email = tc("required", { field: tc("email") });
    } else if (!isValidEmail(email)) {
      nextErrors.email = t("invalidEmail");
    }
    if (!password) {
      nextErrors.password = tc("required", { field: tc("password") });
    } else if (password.length < 6) {
      nextErrors.password = t("passwordTooShort");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await appClient.api.auth["sign-up"].email.$post({
        json: { name, email, password },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(getErrorMessage(json) || t("registrationFailed"));
      }
      await onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("registrationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">{tc("name")}</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldError
            errors={errors.name ? [{ message: errors.name }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">{tc("email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError
            errors={errors.email ? [{ message: errors.email }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">{tc("password")}</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError
            errors={
              errors.password ? [{ message: errors.password }] : undefined
            }
          />
        </Field>
      </FieldGroup>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("creatingAccount") : t("createAccountBtn")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </button>
      </p>
    </form>
  );
}
