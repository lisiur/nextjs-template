"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { appClient, useSession, withApiFeedback } from "@/lib/api";
import { OrgInfoForm } from "./components/org-info-form";
import { OrgLogoUpload } from "./components/org-logo-upload";

interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const { data: session } = useSession();
  const organizationId = session?.session.activeOrganizationId;
  const queryClient = useQueryClient();

  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    setLoading(true);
    withApiFeedback(appClient.api.organizations[":id"].settings.$get)({
      param: { id: organizationId },
    })
      .then(async (res) => {
        const data = await res.json();
        if (active) setOrg(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  function invalidateMine() {
    void queryClient.invalidateQueries({ queryKey: ["organizations", "mine"] });
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (failed || !org) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("logo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgLogoUpload
              organizationId={org.id}
              currentLogo={org.logo}
              name={org.name}
              onLogoUpdate={(url) => {
                setOrg({ ...org, logo: url });
                invalidateMine();
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("generalInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgInfoForm
              organizationId={org.id}
              initialName={org.name}
              initialSlug={org.slug}
              onUpdated={({ name, slug }) => {
                setOrg({ ...org, name, slug });
                invalidateMine();
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
