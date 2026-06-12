"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/api";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data, isPending, fetched, refetch } = useSession();
  const t = useTranslations("Auth");
  const retriedRef = useRef(false);

  useEffect(() => {
    if (fetched && !data && !retriedRef.current) {
      retriedRef.current = true;
      void refetch();
    }
  }, [fetched, data, refetch]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (fetched && !data) {
    return (
      <Dialog open disablePointerDismissal>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("sessionExpired")}</DialogTitle>
            <DialogDescription>
              {t("sessionExpiredDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => window.location.assign("/organization/sign-in")}
            >
              {t("goToLogin")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}
