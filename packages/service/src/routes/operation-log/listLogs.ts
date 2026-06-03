import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { listLogs } from "#services/operation-log.service";
import { prepend } from "#utils/list";
import { listLogsQuerySchema, listLogsResponseSchema } from "./schema";

export const listLogsRoute = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("operation-log::list")),
    method: "get",
    path: "/",
    tags: ["Log"],
    summary: "List operation logs",
    description:
      "Returns a paginated list of operation logs with optional filters.",
    request: {
      query: listLogsQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": {
            schema: listLogsResponseSchema,
          },
        },
        description: "Paginated list of logs",
      },
    },
  }),
  handler: async (c) => {
    const query = c.req.valid("query");
    const result = await listLogs(query);
    return c.json(result, 200);
  },
});
