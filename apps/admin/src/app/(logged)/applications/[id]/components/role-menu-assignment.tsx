"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { appClient } from "@/lib/api";
import { apiWithFeedback } from "@/lib/api/utils";
import { RoleMenuTree } from "../../../roles/[roleId]/menus/components/role-menu-tree";

interface Role {
  id: string;
  appId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

interface Menu {
  id: string;
  appId: string;
  parentId?: string | null;
  name: string;
  code: string;
  icon?: string | null;
  linkType: "GROUP" | "INTERNAL" | "EXTERNAL";
  url?: string | null;
  sortOrder: number;
}

interface RoleMenuAssignmentProps {
  appId: string;
  role: Role | null;
}

export function RoleMenuAssignment({ appId, role }: RoleMenuAssignmentProps) {
  const t = useTranslations("RoleMenus");
  const [appMenus, setAppMenus] = useState<Menu[]>([]);
  const [assignedMenuIds, setAssignedMenuIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const skeletonIds = useRef(
    Array.from({ length: 5 }, () => crypto.randomUUID()),
  );

  const fetchAssignment = useCallback(async () => {
    if (!role) return;

    setLoading(true);
    try {
      const [menusRes, roleMenusRes] = await Promise.all([
        apiWithFeedback(appClient.api.menu.$get)({
          query: { appId },
        }),
        apiWithFeedback(appClient.api["menu-role"][":roleId"].$get)({
          param: { roleId: role.id },
        }),
      ]);

      const menusData = await menusRes.json();
      const roleMenusData = await roleMenusRes.json();
      const menuIds = new Set(menusData.menus.map((menu: Menu) => menu.id));

      setAppMenus(menusData.menus);
      setAssignedMenuIds(
        new Set(
          roleMenusData.menus
            .filter((menu: Menu) => menuIds.has(menu.id))
            .map((menu: Menu) => menu.id),
        ),
      );
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [appId, role, t]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleSave = useCallback(async () => {
    if (!role) return;

    setSaving(true);
    try {
      await apiWithFeedback(appClient.api["menu-role"].batch.$put)({
        json: {
          roleId: role.id,
          menuIds: Array.from(assignedMenuIds),
        },
      });
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }, [role, assignedMenuIds, t]);

  if (!role) {
    return (
      <div className="flex min-h-64 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("selectRole")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
      <div className="min-h-0 flex-1 overflow-auto rounded-md border p-1">
        {loading ? (
          <div className="space-y-2">
            {skeletonIds.current.map((id) => (
              <Skeleton key={id} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <RoleMenuTree
            menus={appMenus}
            checkedIds={assignedMenuIds}
            onCheckedChange={setAssignedMenuIds}
          />
        )}
      </div>

      <div className="mt-4 flex shrink-0 justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
