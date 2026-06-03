import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { getAuditLogById } from "#services/audit-log.service";
import { prepend } from "#utils/list";
import { auditLogIdParamSchema, auditLogSchema, errorSchema } from "./schema";

export const getAuditLog = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("audit-log::view")),
    method: "get",
    path: "/{id}",
    tags: ["AuditLog"],
    summary: "Get an audit log entry",
    description: "Returns a single audit log by ID.",
    request: {
      params: auditLogIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": { schema: auditLogSchema },
        },
        description: "The audit log entry",
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
    const log = await getAuditLogById(id);
    return c.json(log, 200);
  },
});
