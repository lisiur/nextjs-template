"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfigField } from "./config-field";

interface ConfigItem {
  id: string;
  group: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string | null;
  isSecret: boolean;
  sortOrder: number;
}

interface ConfigGroupProps {
  group: string;
}

export function ConfigGroup({ group }: ConfigGroupProps) {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/system-config/${group}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setItems(data);
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [group]);

  const schema = z.object(
    Object.fromEntries(items.map((item) => [item.key, z.string()])),
  );

  const form = useForm({
    resolver: zodResolver(schema),
    values: Object.fromEntries(items.map((item) => [item.key, item.value])),
  });

  async function handleSave() {
    setSaving(true);
    try {
      const payload = items.map((item) => ({
        group: item.group,
        key: item.key,
        value: form.getValues(item.key),
        type: item.type,
        label: item.label,
        description: item.description ?? undefined,
        isSecret: item.isSecret,
        sortOrder: item.sortOrder,
      }));
      const res = await fetch("/api/system-config/batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
      {items.map((item) => (
        <ConfigField key={item.key} item={item} control={form.control} />
      ))}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
