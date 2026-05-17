"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appClient } from "@/lib/api";

const orgSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional().or(z.literal("")),
  metadata: z.string().optional(),
});

type OrgInput = z.infer<typeof orgSchema>;

interface OrganizationDialogProps {
  organization?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    metadata?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function OrganizationDialog({
  organization,
  open,
  onOpenChange,
  onSuccess,
}: OrganizationDialogProps) {
  const t = useTranslations("Organizations");
  const isEdit = !!organization;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<OrgInput>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
      logo: organization?.logo ?? "",
      metadata: organization?.metadata ?? "",
    },
  });

  const watchName = watch("name");

  useEffect(() => {
    if (!isEdit && watchName) {
      setValue("slug", slugify(watchName));
    }
  }, [isEdit, watchName, setValue]);

  async function onSubmit(data: OrgInput) {
    try {
      if (isEdit) {
        await appClient.api.organizations[":id"].$put({
          param: { id: organization.id },
          json: {
            name: data.name,
            slug: data.slug,
            logo: data.logo || null,
            metadata: data.metadata || null,
          },
        });
      } else {
        await appClient.api.organizations.$post({
          json: {
            name: data.name,
            slug: data.slug,
            logo: data.logo || undefined,
            metadata: data.metadata || undefined,
          },
        });
      }
      reset();
      onSuccess();
    } catch {
      // Error handled by client
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editOrg") : t("addOrg")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editOrgDescription") : t("addOrgDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t("slug")}</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">{t("logo")}</Label>
            <Input id="logo" {...register("logo")} placeholder="https://" />
            {errors.logo && (
              <p className="text-sm text-destructive">{errors.logo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="metadata">{t("metadata")}</Label>
            <Textarea id="metadata" {...register("metadata")} rows={3} />
            {errors.metadata && (
              <p className="text-sm text-destructive">
                {errors.metadata.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
