"use client";

import { useEffect } from "react";
import { useSystemConfigStore } from "@/stores/system-config-store";

export function useAppName() {
  const appName = useSystemConfigStore((s) => s.configs["site.name"] ?? "");
  const loading = useSystemConfigStore((s) => s.loading);
  const fetchByGroup = useSystemConfigStore((s) => s.fetchByGroup);

  useEffect(() => {
    fetchByGroup("general");
  }, [fetchByGroup]);

  return { appName, loading };
}
