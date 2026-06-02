"use client";

import { LanguagesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const locales: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Header");

  function handleChange(value: string) {
    // biome-ignore lint/suspicious/noDocumentCookie: simple cookie setter for locale
    document.cookie = `locale=${value};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <LanguagesIcon className="size-4 text-muted-foreground" />
        <span>{t("language")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {locales.map((l) => (
          <DropdownMenuCheckboxItem
            key={l.value}
            checked={locale === l.value}
            onClick={() => handleChange(l.value)}
          >
            {l.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
