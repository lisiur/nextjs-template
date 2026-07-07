"use client";

import { useRegistrationEnabled } from "@repo/frontend";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AuthFooter } from "@/components/auth/auth-footer";
import { RegisterForm } from "@/components/auth/register-form";
import { appClient } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const { registrationEnabled, isLoading } = useRegistrationEnabled(
    async () => {
      const res = await appClient.api.auth["registration-status"].$get();
      return (await res.json()).registrationEnabled;
    },
  );

  useEffect(() => {
    if (!isLoading && !registrationEnabled) router.replace("/sign-in");
  }, [isLoading, registrationEnabled, router]);

  if (isLoading || !registrationEnabled) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t("createAccount")}</CardTitle>
            <CardDescription>{t("signUpDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm
              onSuccess={() => router.push("/")}
              onSwitchToLogin={() => router.push("/sign-in")}
            />
          </CardContent>
        </Card>
      </div>
      <AuthFooter />
    </div>
  );
}
