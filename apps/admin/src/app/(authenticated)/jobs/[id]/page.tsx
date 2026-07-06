"use client";

import {
  Badge,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { use, useCallback, useEffect, useState } from "react";
import { ManagementPageShell } from "@/components/management-page-shell";
import { appClient } from "@/lib/api";
import { withApiFeedback } from "@/lib/api/utils";
import {
  JobDetailOverview,
  JobDetailPayload,
  JobDetailResult,
} from "./components/job-detail-tabs";

export interface JobDetail {
  id: string;
  type: string;
  payload: unknown;
  status: string;
  priority: string;
  result: unknown;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  timeoutMs: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const t = useTranslations("Jobs");
  const { id } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    try {
      const res = await withApiFeedback(appClient.api.jobs[":id"].$get)({
        param: { id },
      });
      setJob((await res.json()) as JobDetail);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const backLink = (
    <Link
      href="/jobs"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("detail.backToJobs")}
    </Link>
  );

  if (loading) {
    return (
      <ManagementPageShell
        title={t("detail.title")}
        description={t("detail.description")}
        header={backLink}
      >
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      </ManagementPageShell>
    );
  }

  if (!job) {
    return (
      <ManagementPageShell
        title={t("detail.title")}
        description={t("detail.description")}
        header={backLink}
      >
        <p className="text-muted-foreground">{t("detail.notFound")}</p>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={
        <>
          {t("detail.title")} — <span className="font-mono">{job.type}</span>
        </>
      }
      description={
        <span className="inline-flex items-center gap-2">
          <Badge variant="outline">{t(`status.${job.status}`)}</Badge>
          <Badge variant="secondary">{t(`priority.${job.priority}`)}</Badge>
          <span className="font-mono text-xs">{job.id}</span>
        </span>
      }
      header={backLink}
    >
      <Tabs
        defaultValue="overview"
        className="flex min-h-0 flex-col overflow-hidden"
      >
        <TabsList className="mb-6 w-fit shrink-0">
          <TabsTrigger value="overview">
            {t("detail.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="payload">{t("detail.tabs.payload")}</TabsTrigger>
          <TabsTrigger value="result">{t("detail.tabs.result")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex min-h-0 flex-1">
          <JobDetailOverview job={job} />
        </TabsContent>
        <TabsContent value="payload" className="flex min-h-0 flex-1">
          <JobDetailPayload payload={job.payload} />
        </TabsContent>
        <TabsContent value="result" className="flex min-h-0 flex-1">
          <JobDetailResult job={job} />
        </TabsContent>
      </Tabs>
    </ManagementPageShell>
  );
}
