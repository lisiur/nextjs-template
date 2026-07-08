"use client";

import {
  Badge,
  Button,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Unlock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { appClient } from "@/lib/api";
import { withApiFeedback } from "@/lib/api/utils";
import { formatDateTime } from "@/utils/date";

interface Bucket {
  limiter: string;
  subject: string;
  count: number;
  max: number | null;
  remaining: number | null;
  bypass: boolean;
  blocked: boolean;
  resetAt: string;
}

interface StatusResponse {
  limiters: { name: string; max: number; windowMs: number }[];
  blockedCount: number;
  buckets: Bucket[];
}

export function RateLimitStatus() {
  const t = useTranslations("RateLimit.status");
  const queryClient = useQueryClient();
  const [limiterFilter, setLimiterFilter] = useState<string>("all");
  const [blockedOnly, setBlockedOnly] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["rate-limit-status", limiterFilter, blockedOnly],
    queryFn: async () => {
      const res = await appClient.api["rate-limit"].status.$get({
        query: {
          limiter: limiterFilter === "all" ? undefined : limiterFilter,
          blocked: blockedOnly ? true : undefined,
        },
      });
      return (await res.json()) as StatusResponse;
    },
    refetchInterval: 5000,
  });

  const releaseMutation = useMutation({
    mutationFn: async (bucket: Bucket) => {
      await withApiFeedback(appClient.api["rate-limit"].release.$post)({
        json: { subject: bucket.subject, limiter: bucket.limiter },
      });
    },
    onSuccess: () => {
      toast.success(t("releaseSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["rate-limit-status"] });
    },
  });

  const limiterOptions = useMemo(
    () => ["all", ...(data?.limiters.map((l) => l.name) ?? [])],
    [data],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={limiterFilter}
          onChange={(e) => setLimiterFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
        >
          {limiterOptions.map((name) => (
            <option key={name} value={name}>
              {name === "all" ? t("allLimiters") : name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={blockedOnly}
            onCheckedChange={(v) => setBlockedOnly(v === true)}
          />
          {t("blockedOnly")}
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          />
          {t("refresh")}
        </Button>
        {data && (
          <Badge variant={data.blockedCount > 0 ? "destructive" : "secondary"}>
            {t("blockedSummary", { count: data.blockedCount })}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto rounded-lg border">
        <Table>
          <TableHeader sticky>
            <TableRow>
              <TableHead>{t("subject")}</TableHead>
              <TableHead>{t("limiter")}</TableHead>
              <TableHead>{t("count")}</TableHead>
              <TableHead>{t("limit")}</TableHead>
              <TableHead>{t("remaining")}</TableHead>
              <TableHead>{t("statusLabel")}</TableHead>
              <TableHead>{t("resetAt")}</TableHead>
              <TableHead sticky="right" align="right">
                {t("release")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : data && data.buckets.length > 0 ? (
              data.buckets.map((bucket) => (
                <TableRow key={`${bucket.limiter}:${bucket.subject}`}>
                  <TableCell className="font-mono text-sm">
                    {bucket.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bucket.limiter}</Badge>
                  </TableCell>
                  <TableCell>{bucket.count}</TableCell>
                  <TableCell>{bucket.max ?? "∞"}</TableCell>
                  <TableCell>{bucket.remaining ?? "∞"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        bucket.blocked
                          ? "destructive"
                          : bucket.bypass
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {bucket.blocked
                        ? t("blocked")
                        : bucket.bypass
                          ? t("bypass")
                          : t("ok")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(bucket.resetAt)}
                  </TableCell>
                  <TableCell sticky="right" align="right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("release")}
                      disabled={releaseMutation.isPending}
                      onClick={() => releaseMutation.mutate(bucket)}
                    >
                      <Unlock className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-8 text-center"
                >
                  {t("noBuckets")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
