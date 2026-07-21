"use client";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@repo/ui";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { appClient } from "@/lib/api";
import { withApiFeedback } from "@/lib/api/utils";

interface AttachmentDownloadDialogProps {
  open: boolean;
  attachment: {
    id: string;
    visibility: string;
    upload: { path: string };
  } | null;
  onOpenChange: (open: boolean) => void;
}

export function AttachmentDownloadDialog({
  open,
  attachment,
  onOpenChange,
}: AttachmentDownloadDialogProps) {
  const t = useTranslations("Attachments");
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!attachment) return;
    setDownloading(true);
    try {
      let url = `/api/attachment/${attachment.id}`;
      if (attachment.visibility === "private") {
        const res = await withApiFeedback(
          appClient.api.attachment[":id"].sign.$post,
        )({
          param: { id: attachment.id },
        });
        const data = await res.json();
        url = data.url;
      }
      const link = document.createElement("a");
      link.href = `${window.location.origin}${url}`;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
      onOpenChange(false);
    } catch {
      // Error handled by API feedback.
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("downloadTitle")}</DialogTitle>
          {attachment && (
            <DialogDescription>{attachment.upload.path}</DialogDescription>
          )}
        </DialogHeader>
        <DialogBody>
          <p className="text-muted-foreground text-sm">{t("downloadHint")}</p>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Spinner /> : <Download className="h-4 w-4" />}
            {t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
