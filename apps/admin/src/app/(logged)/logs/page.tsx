"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogTable } from "./components/audit-log-table";
import { OperationLogTable } from "./components/operation-log-table";

export interface TraceFilterRequest {
  traceId: string;
  nonce: number;
}

export default function LogsPage() {
  const t = useTranslations("Logs");
  const [activeTab, setActiveTab] = useState("operation");
  const [operationTraceRequest, setOperationTraceRequest] =
    useState<TraceFilterRequest>();
  const [auditTraceRequest, setAuditTraceRequest] =
    useState<TraceFilterRequest>();

  function handleOperationTrace(trace: string) {
    setAuditTraceRequest({ traceId: trace, nonce: Date.now() });
    setActiveTab("audit");
  }

  function handleAuditTrace(trace: string) {
    setOperationTraceRequest({ traceId: trace, nonce: Date.now() });
    setActiveTab("operation");
  }

  return (
    <div className="container mx-auto flex h-full flex-col overflow-hidden py-8">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="min-h-0 flex-1 overflow-hidden"
      >
        <TabsList>
          <TabsTrigger value="operation">{t("tabs.operation")}</TabsTrigger>
          <TabsTrigger value="audit">{t("tabs.audit")}</TabsTrigger>
        </TabsList>
        <TabsContent value="operation" className="flex min-h-0 overflow-hidden">
          <OperationLogTable
            key={operationTraceRequest?.nonce ?? "operation"}
            traceRequest={operationTraceRequest}
            onTraceChange={handleOperationTrace}
          />
        </TabsContent>
        <TabsContent value="audit" className="flex min-h-0 overflow-hidden">
          <AuditLogTable
            key={auditTraceRequest?.nonce ?? "audit"}
            traceRequest={auditTraceRequest}
            onTraceChange={handleAuditTrace}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
