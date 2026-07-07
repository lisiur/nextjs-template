"use client";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Spinner,
  Textarea,
} from "@repo/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { appClient } from "@/lib/api";
import { withApiFeedback } from "@/lib/api/utils";

const PRIORITY_OPTIONS = ["CRITICAL", "HIGH", "NORMAL", "LOW", "IDLE"] as const;

export interface JobInitialValues {
  type: string;
  description?: string;
  payload: unknown;
  priority: string;
  maxAttempts: number;
  timeoutMs: number;
}

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  initialValues?: JobInitialValues;
}

export function CreateJobDialog({
  open,
  onOpenChange,
  onCreated,
  initialValues,
}: CreateJobDialogProps) {
  const t = useTranslations("Jobs");
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("NORMAL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [timeoutMs, setTimeoutMs] = useState("60000");
  const [payload, setPayload] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setType("");
    setDescription("");
    setPriority("NORMAL");
    setScheduledAt("");
    setMaxAttempts("3");
    setTimeoutMs("60000");
    setPayload("");
    setErrors({});
  }

  useEffect(() => {
    if (open && initialValues) {
      setType(initialValues.type);
      setDescription(initialValues.description ?? "");
      setPriority(initialValues.priority);
      setMaxAttempts(String(initialValues.maxAttempts));
      setTimeoutMs(String(initialValues.timeoutMs));
      setPayload(
        initialValues.payload != null
          ? JSON.stringify(initialValues.payload, null, 2)
          : "",
      );
      setErrors({});
    }
  }, [open, initialValues]);

  function handleClose(open: boolean) {
    if (!open) resetForm();
    onOpenChange(open);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!type.trim()) newErrors.type = t("form.typePlaceholder");

    let parsedPayload: unknown = null;
    if (payload.trim()) {
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        newErrors.payload = t("form.payloadInvalid");
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      await withApiFeedback(appClient.api.jobs.$post)({
        json: {
          type: type.trim(),
          description: description.trim() || undefined,
          payload: parsedPayload,
          priority: priority as "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | "IDLE",
          maxAttempts: Number(maxAttempts),
          timeoutMs: Number(timeoutMs),
          ...(scheduledAt ? { scheduledAt: scheduledAt } : {}),
        },
      });
      toast.success(t(initialValues ? "duplicateSuccess" : "createSuccess"));
      handleClose(false);
      onCreated();
    } catch {
      // Error handled by API feedback.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialValues ? t("duplicateJob") : t("addJob")}
          </DialogTitle>
        </DialogHeader>
        <form id="create-job-form" onSubmit={handleSubmit}>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="job-type">{t("form.type")}</FieldLabel>
              <Input
                id="job-type"
                placeholder={t("form.typePlaceholder")}
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              />
              <FieldDescription>{t("form.typeDescription")}</FieldDescription>
              {errors.type && <FieldError>{errors.type}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="job-description">
                {t("form.description")}
              </FieldLabel>
              <Textarea
                id="job-description"
                placeholder={t("form.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-16 text-sm"
              />
              <FieldDescription>
                {t("form.descriptionDescription")}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="job-priority">
                {t("form.priority")}
              </FieldLabel>
              <Select
                value={priority}
                onValueChange={(v: string | null) => setPriority(v ?? "NORMAL")}
              >
                <SelectTrigger id="job-priority">
                  {t(`priority.${priority}`)}
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="job-scheduledAt">
                {t("form.scheduledAt")}
              </FieldLabel>
              <Input
                id="job-scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <FieldDescription>
                {t("form.scheduledAtDescription")}
              </FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <Field>
                <FieldLabel htmlFor="job-maxAttempts">
                  {t("form.maxAttempts")}
                </FieldLabel>
                <Input
                  id="job-maxAttempts"
                  type="number"
                  min={1}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                />
                <FieldDescription>
                  {t("form.maxAttemptsDescription")}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="job-timeoutMs">
                  {t("form.timeoutMs")}
                </FieldLabel>
                <Input
                  id="job-timeoutMs"
                  type="number"
                  min={1}
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(e.target.value)}
                />
                <FieldDescription>
                  {t("form.timeoutMsDescription")}
                </FieldDescription>
              </Field>
            </Field>

            <Field>
              <FieldLabel htmlFor="job-payload">{t("form.payload")}</FieldLabel>
              <Textarea
                id="job-payload"
                placeholder={t("form.payloadPlaceholder")}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="min-h-24 font-mono text-xs"
              />
              <FieldDescription>
                {t("form.payloadDescription")}
              </FieldDescription>
              {errors.payload && <FieldError>{errors.payload}</FieldError>}
            </Field>
          </DialogBody>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
          >
            {t("cancelBtn")}
          </Button>
          <Button type="submit" form="create-job-form" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? t("creating") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
