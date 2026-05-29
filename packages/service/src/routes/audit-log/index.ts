import { OpenAPIHono } from "@hono/zod-openapi";
import { getAuditLog } from "./getAuditLog";
import { listAuditLogs } from "./listAuditLogs";

const auditLogRoutesHono = new OpenAPIHono();

const routes = auditLogRoutesHono.openapiRoutes([
  listAuditLogs,
  getAuditLog,
] as const);

export { routes as auditLogRoutes };
