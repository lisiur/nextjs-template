"use client";

import { useTranslations } from "next-intl";
import { ManagementPageShell } from "@/components/management-page-shell";
import { AttachmentTable } from "./components/attachment-table";

export default function AttachmentsPage() {
  const t = useTranslations("Attachments");
  return (
    <ManagementPageShell title={t("title")} description={t("description")}>
      <AttachmentTable />
    </ManagementPageShell>
  );
}
