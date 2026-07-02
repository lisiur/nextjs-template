"use client";

import type { PermissionItem } from "@repo/frontend";
import { PermissionSelector } from "@repo/frontend";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { appClient, withApiFeedback } from "@/lib/api";

interface PositionPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  positionId: string;
  positionName: string;
}

export function PositionPermissionsDialog({
  open,
  onOpenChange,
  orgId,
  positionId,
  positionName,
}: PositionPermissionsDialogProps) {
  const t = useTranslations("Positions");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["position-permissions", orgId, positionId],
    queryFn: async () => {
      const res = await withApiFeedback(
        appClient.api.organizations[":orgId"].positions[":id"].permissions.$get,
      )({
        param: { orgId, id: positionId },
      });
      const json = await res.json();
      return json as {
        assigned: PermissionItem[];
        available: PermissionItem[];
      };
    },
    enabled: open,
  });

  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const currentIds = selectedIds ?? data?.assigned.map((p) => p.id) ?? [];

  const mutation = useMutation({
    mutationFn: async (permissionIds: string[]) => {
      await withApiFeedback(
        appClient.api.organizations[":orgId"].positions[":id"].permissions.$put,
      )({
        param: { orgId, id: positionId },
        json: { permissionIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["position-permissions", orgId, positionId],
      });
      toast.success(t("permissionsUpdated"));
      onOpenChange(false);
      setSelectedIds(null);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedIds(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("managePermissions")}</DialogTitle>
          <DialogDescription>
            {t("managePermissionsDescription", { name: positionName })}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <PermissionSelector
              permissions={data?.available ?? []}
              value={currentIds}
              onChange={setSelectedIds}
              height={400}
              emptyText={t("noPermissionsAvailable")}
              noResultsText={t("noResults")}
              searchPlaceholder={t("search")}
              selectAllText={t("selectAll")}
              selectedHeaderText={t("selected")}
              selectedEmptyText={t("noPermissionsSelected")}
              clearAllText={t("clearAll")}
              previousText={tc("previous")}
              nextText={tc("next")}
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate(currentIds)}
            disabled={mutation.isPending || isLoading}
          >
            {mutation.isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
