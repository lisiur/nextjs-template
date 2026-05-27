"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const ACTION_OPTIONS = [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "assign",
  "remove",
  "batchUpsert",
] as const;

const MODULE_OPTIONS = [
  "user",
  "organization",
  "application",
  "menu",
  "role",
  "system-config",
  "user-role",
  "menu-role",
  "auth",
] as const;

export interface LogFilters {
  action?: string;
  module?: string;
  startDate?: Date;
  endDate?: Date;
}

interface LogFilterProps {
  filters: LogFilters;
  onFiltersChange: (
    newFiltersOrFn: LogFilters | ((prev: LogFilters) => LogFilters),
  ) => void;
}

export function LogFilter({ filters, onFiltersChange }: LogFilterProps) {
  const t = useTranslations("Logs");
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;

  const [resetKey, setResetKey] = useState(0);

  const hasFilters =
    filters.action || filters.module || filters.startDate || filters.endDate;

  const handleDateChange = useCallback((range: DateRange | undefined) => {
    onFiltersChangeRef.current((prev: LogFilters) => ({
      ...prev,
      startDate: range?.from,
      endDate: range?.to,
    }));
  }, []);

  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  });

  function handleClear() {
    setResetKey((k) => k + 1);
    onFiltersChange({});
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.module ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            module: !value || value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger>
          {filters.module
            ? t(`modules.${filters.module}`)
            : t("filters.allModules")}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allModules")}</SelectItem>
          {MODULE_OPTIONS.map((mod) => (
            <SelectItem key={mod} value={mod}>
              {t(`modules.${mod}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.action ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            action: !value || value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger>
          {filters.action
            ? t(`actions.${filters.action}`)
            : t("filters.allActions")}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allActions")}</SelectItem>
          {ACTION_OPTIONS.map((action) => (
            <SelectItem key={action} value={action}>
              {t(`actions.${action}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker
        key={resetKey}
        startDate={filters.startDate ?? null}
        endDate={filters.endDate ?? null}
        onChange={handleDateChange}
        className="w-auto"
      />

      {hasFilters && (
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
