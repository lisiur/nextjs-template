"use client";

import { icons, type LucideIcon, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";

interface IconPickerProps {
  value?: string;
  onChange?: (value: string | null) => void;
  className?: string;
}

const iconsRecord = icons as Record<string, LucideIcon>;

// Build a sorted list of icon names from lucide-react
const iconNames = Object.keys(iconsRecord) as string[];

// Pre-compute lowercase names for fast search
const iconLookup = iconNames.map((name) => ({
  name,
  label: name.replace(/-/g, " "),
  lower: name.toLowerCase(),
}));

const GRID_COLUMNS = 8;

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return iconLookup;
    const q = search.toLowerCase();
    return iconLookup.filter(
      (item) => item.lower.includes(q) || item.label.includes(q),
    );
  }, [search]);

  const CurrentIcon = value ? iconsRecord[value] : undefined;

  function handleSelect(name: string) {
    onChange?.(name);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(null);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              className,
            )}
          />
        }
      >
        {CurrentIcon ? (
          <CurrentIcon className="h-4 w-4 shrink-0" />
        ) : (
          <span className="h-4 w-4 shrink-0 rounded bg-muted" />
        )}
        <span className="flex-1 truncate text-left text-muted-foreground">
          {value || "Select icon..."}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleClear(e as unknown as React.MouseEvent);
            }}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ×
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="bottom" sideOffset={4}>
        <div className="p-2.5">
          <div className="relative">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="h-8 pl-7"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto px-2.5 pb-2.5">
          <div className="text-xs text-muted-foreground mb-1.5">
            {filtered.length} icons
          </div>
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
            }}
          >
            {filtered.map((item) => {
              const Icon = iconsRecord[item.name];
              if (!Icon) return null;
              const isSelected = value === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  title={item.label}
                  onClick={() => handleSelect(item.name)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent",
                    isSelected &&
                      "bg-accent text-accent-foreground ring-1 ring-ring",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No icons found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
