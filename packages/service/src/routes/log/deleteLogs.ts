import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { prisma } from "#lib/db";
import { requireAdmin } from "#middleware/require-admin";
import {
  deleteLogsBodySchema,
  deleteSuccessSchema,
  errorSchema,
} from "./schema";

export const deleteLogs = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/",
    tags: ["Log"],
    summary: "Delete logs",
    description: "Batch delete operation logs by IDs.",
    middleware: requireAdmin,
    request: {
      body: {
        content: {
          "application/json": {
            schema: deleteLogsBodySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: deleteSuccessSchema },
        },
        description: "Successfully deleted",
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
    const { ids } = c.req.valid("json");

    await prisma.operationLog.deleteMany({
      where: { id: { in: ids } },
    });

    return c.json({ success: true as const }, 200);
  },
});
