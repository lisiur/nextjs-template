"use client";

import { Button, Spinner } from "@repo/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ManagementPageShell } from "@/components/management-page-shell";
import { useSession } from "@/lib/api";
import { DepartmentDialog } from "./components/department-dialog";
import { DepartmentTree } from "./components/department-tree";

export default function DepartmentsPage() {
  const t = useTranslations("Departments");
  const { data: session } = useSession();
  const orgId = session?.session.activeOrganizationId;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <ManagementPageShell
      title={t("title")}
      description={t("description")}
    >
      {orgId ? (
        <>
          <div className="mb-4 shrink-0">
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
        </>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center py-8">
          <Spinner />
        </div>
      )}
    </ManagementPageShell>
  );
}
