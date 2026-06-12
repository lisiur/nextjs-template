"use client";

import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@repo/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { appClient } from "@/lib/api";

type FieldErrors = {
  name?: string;
  slug?: string;
};

interface OrganizationRegistrationFormProps {
  onSuccess?: () => void | Promise<void>;
}

function getErrorMessage(json: unknown) {
  if (typeof json === "object" && json !== null) {
    if ("message" in json && typeof json.message === "string") {
      return json.message;
    }
    if ("error" in json) {
      const { error } = json;
      if (typeof error === "string") return error;
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        return error.message;
      }
    }
  }

  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function OrganizationRegistrationForm({
  onSuccess,
}: OrganizationRegistrationFormProps) {
  const t = useTranslations("RegisterOrganization");
  const tc = useTranslations("Common");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [metadata, setMetadata] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!name) nextErrors.name = tc("required", { field: t("name") });
    if (!slug) {
      nextErrors.slug = tc("required", { field: t("slug") });
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      nextErrors.slug = t("invalidSlug");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await appClient.api.organizations.register.$post({
        json: {
          name,
          slug,
          metadata: metadata || undefined,
        },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(getErrorMessage(json) || t("registrationFailed"));
      }
      toast.success(t("registrationSuccess"));
      await onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("registrationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="organization-name">{t("name")}</FieldLabel>
          <Input
            id="organization-name"
            value={name}
            placeholder={t("namePlaceholder")}
            onChange={(event) => handleNameChange(event.target.value)}
          />
          <FieldError
            errors={errors.name ? [{ message: errors.name }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="organization-slug">{t("slug")}</FieldLabel>
          <Input
            id="organization-slug"
            value={slug}
            placeholder="acme-corp"
            onChange={(event) => handleSlugChange(event.target.value)}
          />
          <FieldDescription>{t("slugDescription")}</FieldDescription>
          <FieldError
            errors={errors.slug ? [{ message: errors.slug }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="organization-metadata">
            {t("metadata")}
          </FieldLabel>
          <Textarea
            id="organization-metadata"
            value={metadata}
            rows={3}
            placeholder={t("metadataPlaceholder")}
            onChange={(event) => setMetadata(event.target.value)}
          />
          <FieldDescription>{t("metadataDescription")}</FieldDescription>
        </Field>
      </FieldGroup>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("registering") : t("submit")}
      </Button>
    </form>
  );
}
