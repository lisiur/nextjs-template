"use client";

import { useTranslations } from "next-intl";
import { UserTable } from "./components/user-table";

export default function UsersPage() {
  const t = useTranslations("Users");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <UserTable />
    </div>
  );
}
