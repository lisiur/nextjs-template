"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { redirectToFirstMenuOrProfile } from "@/lib/navigation/menu-redirect";
import { useMenuStore } from "@/stores/menu-store";
import { OrganizationRegistrationForm } from "./components/organization-registration-form";

export default function RegisterOrganizationPage() {
  const router = useRouter();
  const t = useTranslations("RegisterOrganization");
  const refetchMenus = useMenuStore((state) => state.refetchMenus);

  async function handleSuccess() {
    await redirectToFirstMenuOrProfile(router, refetchMenus);
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationRegistrationForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
