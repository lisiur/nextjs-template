import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { prisma } from "#lib/db";
import { requireAdmin } from "#middleware/require-admin";
import { auditLogIdParamSchema, auditLogSchema, errorSchema } from "./schema";

export const getAuditLog = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["AuditLog"],
    summary: "Get an audit log entry",
    description: "Returns a single audit log by ID.",
    middleware: requireAdmin,
    request: {
      params: auditLogIdParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: auditLogSchema },
        },
        description: "The audit log entry",
      },
      401: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Unauthorized",
      },
      404: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Not found",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");

    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log) {
      throw new HTTPException(404, { message: "Audit log not found" });
    }

    return c.json(log, 200);
  },
});
