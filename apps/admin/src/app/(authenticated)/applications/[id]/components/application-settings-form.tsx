"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@repo/ui";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { appClient } from "@/lib/api";
import { uploadPublicFile } from "@/lib/api/upload-file";
import { withApiFeedback } from "@/lib/api/utils";

const FAVICON_ACCEPT =
  ".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/gif,image/webp";

const appSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().optional().or(z.literal("")),
  favicon: z.string().optional().or(z.literal("")),
});

type AppInput = z.infer<typeof appSchema>;

interface ApplicationSettingsFormProps {
  app: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    logo?: string | null;
    favicon?: string | null;
  };
  onSuccess: () => void;
}

export function ApplicationSettingsForm({
  app,
  onSuccess,
}: ApplicationSettingsFormProps) {
  const t = useTranslations("Applications");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoObjectUrlRef = useRef<string | null>(null);
  const faviconObjectUrlRef = useRef<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(app.logo ?? "");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [faviconPreview, setFaviconPreview] = useState<string>(
    app.favicon ?? "",
  );
  const [selectedFaviconFile, setSelectedFaviconFile] = useState<File | null>(
    null,
  );
  const [faviconRemoved, setFaviconRemoved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
  } = useForm<AppInput>({
    resolver: zodResolver(appSchema),
    defaultValues: {
      name: app.name,
      code: app.code,
      description: app.description ?? "",
      logo: app.logo ?? "",
      favicon: app.favicon ?? "",
    },
  });

  const clearLogoObjectUrl = useCallback(() => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = null;
    }
  }, []);

  const clearFaviconObjectUrl = useCallback(() => {
    if (faviconObjectUrlRef.current) {
      URL.revokeObjectURL(faviconObjectUrlRef.current);
      faviconObjectUrlRef.current = null;
    }
  }, []);

  useEffect(() => clearLogoObjectUrl, [clearLogoObjectUrl]);
  useEffect(() => clearFaviconObjectUrl, [clearFaviconObjectUrl]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("logoTooLarge"));
      return;
    }
    clearLogoObjectUrl();
    const previewUrl = URL.createObjectURL(file);
    logoObjectUrlRef.current = previewUrl;
    setSelectedLogoFile(file);
    setLogoRemoved(false);
    setLogoPreview(previewUrl);
    setValue("logo", previewUrl, { shouldDirty: true });
  }

  function handleRemoveLogo() {
    clearLogoObjectUrl();
    setSelectedLogoFile(null);
    setLogoRemoved(true);
    setLogoPreview("");
    setValue("logo", "", { shouldDirty: true });
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("faviconTooLarge"));
      return;
    }
    clearFaviconObjectUrl();
    const previewUrl = URL.createObjectURL(file);
    faviconObjectUrlRef.current = previewUrl;
    setSelectedFaviconFile(file);
    setFaviconRemoved(false);
    setFaviconPreview(previewUrl);
    setValue("favicon", previewUrl, { shouldDirty: true });
  }

  function handleRemoveFavicon() {
    clearFaviconObjectUrl();
    setSelectedFaviconFile(null);
    setFaviconRemoved(true);
    setFaviconPreview("");
    setValue("favicon", "", { shouldDirty: true });
    if (faviconInputRef.current) {
      faviconInputRef.current.value = "";
    }
  }

  async function onSubmit(data: AppInput) {
    try {
      const logo = selectedLogoFile
        ? await uploadPublicFile(selectedLogoFile)
        : logoRemoved
          ? null
          : (app.logo ?? null);

      const favicon = selectedFaviconFile
        ? await uploadPublicFile(selectedFaviconFile)
        : faviconRemoved
          ? null
          : (app.favicon ?? null);

      await withApiFeedback(appClient.api.applications[":id"].$put)({
        param: { id: app.id },
        json: {
          name: data.name,
          code: data.code,
          description: data.description || null,
          logo,
          favicon,
        },
      });
      setSelectedLogoFile(null);
      setSelectedFaviconFile(null);
      setLogoRemoved(false);
      setFaviconRemoved(false);
      toast.success(t("updateSuccess"));
      onSuccess();
    } catch {
      // Error handled by client
    }
  }

  const dirty =
    isDirty ||
    selectedLogoFile !== null ||
    logoRemoved ||
    selectedFaviconFile !== null ||
    faviconRemoved;

  return (
    <div className="flex min-h-0 flex-1 justify-start overflow-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("editApp")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
                <Input id="name" {...register("name")} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
              <Field>
                <FieldLabel htmlFor="code">{t("code")}</FieldLabel>
                <Input id="code" {...register("code")} />
                <FieldError errors={errors.code ? [errors.code] : undefined} />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">
                  {t("description_label")}
                </FieldLabel>
                <Textarea
                  id="description"
                  {...register("description")}
                  rows={3}
                />
                <FieldError
                  errors={errors.description ? [errors.description] : undefined}
                />
              </Field>
              <Field>
                <FieldLabel>{t("logo")}</FieldLabel>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                {logoPreview ? (
                  <div className="relative inline-block">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={80}
                      height={80}
                      className="rounded-lg border object-cover"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {t("uploadLogo")}
                  </Button>
                )}
                <FieldError errors={errors.logo ? [errors.logo] : undefined} />
              </Field>
              <Field>
                <FieldLabel>{t("favicon")}</FieldLabel>
                <input
                  type="file"
                  ref={faviconInputRef}
                  accept={FAVICON_ACCEPT}
                  className="hidden"
                  onChange={handleFaviconChange}
                />
                {faviconPreview ? (
                  <div className="relative inline-block">
                    <Image
                      src={faviconPreview}
                      alt="Favicon preview"
                      width={32}
                      height={32}
                      className="rounded border object-contain"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveFavicon}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {t("uploadFavicon")}
                  </Button>
                )}
                <FieldError
                  errors={errors.favicon ? [errors.favicon] : undefined}
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !dirty}>
                {isSubmitting ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
