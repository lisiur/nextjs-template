import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { prisma } from "#lib/db";
import { requireAdmin } from "#middleware/require-admin";
import {
  errorSchema,
  listLogsQuerySchema,
  listLogsResponseSchema,
} from "./schema";

export const listLogs = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Log"],
    summary: "List operation logs",
    description:
      "Returns a paginated list of operation logs with optional filters.",
    middleware: requireAdmin,
    request: {
      query: listLogsQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listLogsResponseSchema,
          },
        },
        description: "Paginated list of logs",
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
    const { limit, offset, action, module, userId, startDate, endDate } =
      c.req.valid("query");

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (module) where.module = module;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.operationLog.count({ where }),
    ]);

    return c.json({ logs, total }, 200);
  },
});
