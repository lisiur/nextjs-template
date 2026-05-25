import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { prisma } from "#lib/db";
import { requireAdmin } from "#middleware/require-admin";
import { errorSchema, logIdParamSchema, operationLogSchema } from "./schema";

export const getLog = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Log"],
    summary: "Get a log entry",
    description: "Returns a single operation log by ID.",
    middleware: requireAdmin,
    request: {
      params: logIdParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: operationLogSchema },
        },
        description: "The log entry",
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

    const log = await prisma.operationLog.findUnique({ where: { id } });
    if (!log) {
      throw new HTTPException(404, { message: "Log not found" });
    }

    return c.json(log, 200);
  },
});
