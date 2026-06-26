"use client";

import { Button } from "@repo/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSession } from "@/lib/api";
import { DepartmentDialog } from "./components/department-dialog";
import { DepartmentTree } from "./components/department-tree";

export default function DepartmentsPage() {
  const t = useTranslations("Departments");
  const { data: session } = useSession();
  const orgId = session?.session.activeOrganizationId;
  const [createOpen, setCreateOpen] = useState(false);

  if (!orgId) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createDepartment")}
        </Button>
      </div>
      <DepartmentTree orgId={orgId} />
      <DepartmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
      />
    </div>
  );
}
