"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarToggleListener() {
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const handler = () => toggleSidebar();
    window.addEventListener("sidebar-toggle", handler);
    return () => window.removeEventListener("sidebar-toggle", handler);
  }, [toggleSidebar]);

  return null;
}
