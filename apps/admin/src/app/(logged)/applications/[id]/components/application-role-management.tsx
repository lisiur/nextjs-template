"use client";

import { ListChecks } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appClient } from "@/lib/api";
import { apiWithFeedback } from "@/lib/api/utils";

interface Role {
  id: string;
  appId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationRoleManagementProps {
  appId: string;
}

export function ApplicationRoleManagement({
  appId,
}: ApplicationRoleManagementProps) {
  const t = useTranslations("Roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiWithFeedback(appClient.api.roles.$get)({
        query: { appId },
      });
      const data = await res.json();
      setRoles(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [appId, t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <Table containerClassName="min-h-0 flex-1 overflow-auto rounded-md border">
      <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background">
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("code")}</TableHead>
          <TableHead className="sticky right-0 z-30 bg-background text-right shadow-[-1px_0_0_0_var(--border)]">
            {t("actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="font-medium">{role.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{role.code}</Badge>
            </TableCell>
            <TableCell className="sticky right-0 z-10 bg-background text-right shadow-[-1px_0_0_0_var(--border)]">
              <Button
                variant="ghost"
                size="icon"
                nativeButton={false}
                render={<Link href={`/roles/${role.id}/menus`} />}
              >
                <ListChecks className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {roles.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground"
            >
              {t("noRoles")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
