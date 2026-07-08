"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { useTranslations } from "next-intl";
import { ManagementPageShell } from "@/components/management-page-shell";
import { RateLimitOverrides } from "./components/rate-limit-overrides";
import { RateLimitStatus } from "./components/rate-limit-status";

export default function RateLimitPage() {
  const t = useTranslations("RateLimit");

  return (
    <ManagementPageShell title={t("title")} description={t("description")}>
      <Tabs defaultValue="status" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mb-4 w-fit">
          <TabsTrigger value="status">{t("tabs.status")}</TabsTrigger>
          <TabsTrigger value="overrides">{t("tabs.overrides")}</TabsTrigger>
        </TabsList>
        <TabsContent value="status" className="flex min-h-0 flex-1 flex-col">
          <RateLimitStatus />
        </TabsContent>
        <TabsContent value="overrides" className="flex min-h-0 flex-1 flex-col">
          <RateLimitOverrides />
        </TabsContent>
      </Tabs>
    </ManagementPageShell>
  );
}
