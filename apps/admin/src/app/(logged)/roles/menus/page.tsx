"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appClient } from "@/lib/api";
import type { Menu } from "@/lib/api/menu";
import { RoleMenuTree } from "./components/role-menu-tree";

const roles = [
  { id: "admin", name: "Administrator" },
  { id: "manager", name: "Manager" },
  { id: "user", name: "User" },
] as const;

export default function RoleMenusPage() {
  const t = useTranslations("RoleMenus");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [assignedMenuIds, setAssignedMenuIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAllMenus = useCallback(async () => {
    setLoading(true);
    try {
      const appsRes = await appClient.api.applications.$get();
      if (!appsRes.ok) {
        toast.error(t("loadError"));
        return;
      }
      const appsData = await appsRes.json();
      const allMenusFlat: Menu[] = [];

      for (const app of appsData.applications ?? []) {
        const menusRes = await appClient.api.applications[":appId"].menu.$get({
          param: { appId: app.id },
        });
        if (menusRes.ok) {
          const menusData = await menusRes.json();
          allMenusFlat.push(...menusData.menus);
        }
      }

      setAllMenus(allMenusFlat);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchRoleMenus = useCallback(
    async (roleId: string) => {
      setLoading(true);
      try {
        const res = await appClient.api.menu-role[":roleId"].$get({
          param: { roleId },
        });
        if (res.ok) {
          const data = await res.json();
          setAssignedMenuIds(new Set(data.menus.map((m: Menu) => m.id)));
        }
      } catch {
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchAllMenus();
  }, [fetchAllMenus]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRoleMenus(selectedRoleId);
    }
  }, [selectedRoleId, fetchRoleMenus]);

  const handleSave = useCallback(async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const res = await appClient.api.menu-role.batch.$put({
        json: { roleId: selectedRoleId, menuIds: Array.from(assignedMenuIds) },
      });
      if (res.ok) {
        toast.success(t("saved"));
      } else {
        toast.error(t("saveError"));
      }
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }, [selectedRoleId, assignedMenuIds, t]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex gap-6">
        <div className="w-1/3">
          <div className="sticky top-8">
            <label className="mb-2 block text-sm font-medium">
              {t("selectRole")}
            </label>
            <Select
              value={selectedRoleId ?? undefined}
              onValueChange={(value) => setSelectedRoleId(value ?? null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectRolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-2/3">
          {!selectedRoleId ? (
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                {t("noRoleSelected")}
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <RoleMenuTree
                menus={allMenus}
                checkedIds={assignedMenuIds}
                onCheckedChange={setAssignedMenuIds}
              />
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
