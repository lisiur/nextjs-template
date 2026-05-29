import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { prisma } from "#lib/db";
import { requireAdmin } from "#middleware/require-admin";
import {
  errorSchema,
  listAuditLogsQuerySchema,
  listAuditLogsResponseSchema,
} from "./schema";

export const listAuditLogs = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["AuditLog"],
    summary: "List audit logs",
    description:
      "Returns a paginated list of audit logs with optional filters.",
    middleware: requireAdmin,
    request: {
      query: listAuditLogsQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listAuditLogsResponseSchema,
          },
        },
        description: "Paginated list of audit logs",
      },
      401: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const {
      limit,
      offset,
      traceId,
      sessionId,
      userId,
      userName,
      event,
      category,
      severity,
      outcome,
      targetType,
      targetId,
      startDate,
      endDate,
    } = c.req.valid("query");

    const where: Record<string, unknown> = {};
    if (traceId) where.traceId = traceId;
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;
    if (userName) where.userName = { contains: userName, mode: "insensitive" };
    if (event) where.event = event;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (outcome) where.outcome = outcome;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return c.json({ logs, total }, 200);
  },
});
