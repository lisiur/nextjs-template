"use client";

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
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <OrganizationRegistrationForm onSuccess={handleSuccess} />
    </div>
  );
}
