"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("Header");
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between w-full">
      <span className="flex items-center gap-1.5">
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        {t("appearance")}
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}
