"use client";

import {
  Badge,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import { useTranslations } from "next-intl";
import {
  type JobDetail,
  JobDetailOverview,
  JobDetailPayload,
  JobDetailResult,
} from "./job-detail-tabs";

interface JobDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobDetail | null;
  loading: boolean;
  title: string;
}

export function JobDetailSheet({
  open,
  onOpenChange,
  job,
  loading,
  title,
}: JobDetailSheetProps) {
  const t = useTranslations("Jobs");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {job ? (
              <>
                {title} — <span className="font-mono">{job.type}</span>
              </>
            ) : (
              title
            )}
          </SheetTitle>
          <SheetDescription>
            {job ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <Badge variant="outline">{t(`status.${job.status}`)}</Badge>
                <Badge variant="secondary">
                  {t(`priority.${job.priority}`)}
                </Badge>
                <span className="font-mono text-xs">{job.id}</span>
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : job ? (
            <Tabs defaultValue="overview" className="flex min-h-0 flex-col">
              <TabsList className="w-fit shrink-0">
                <TabsTrigger value="overview">
                  {t("detail.tabs.overview")}
                </TabsTrigger>
                <TabsTrigger value="payload">
                  {t("detail.tabs.payload")}
                </TabsTrigger>
                <TabsTrigger value="result">
                  {t("detail.tabs.result")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <JobDetailOverview job={job} />
              </TabsContent>
              <TabsContent value="payload">
                <JobDetailPayload payload={job.payload} />
              </TabsContent>
              <TabsContent value="result">
                <JobDetailResult job={job} />
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-muted-foreground">{t("detail.notFound")}</p>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
