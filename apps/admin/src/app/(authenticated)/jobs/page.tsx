"use client";

import { useTranslations } from "next-intl";
import { ManagementPageShell } from "@/components/management-page-shell";
import { JobTable } from "./components/job-table";

export default function JobsPage() {
  const t = useTranslations("Jobs");

  return (
    <ManagementPageShell title={t("title")} description={t("description")}>
      <JobTable />
    </ManagementPageShell>
  );
}
