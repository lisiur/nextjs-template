import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { listNotificationRecords } from "#services/notification-record.service";
import { prepend } from "#utils/list";
import {
  listNotificationRecordsQuerySchema,
  listNotificationRecordsResponseSchema,
} from "./schema";

export const listNotificationRecordsRoute = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("notification-record::list")),
    method: "get",
    path: "/",
    tags: ["NotificationRecord"],
    summary: "List notification records",
    description:
      "Returns a paginated admin list of notification records with optional filters.",
    request: { query: listNotificationRecordsQuerySchema },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(
        listNotificationRecordsResponseSchema,
        "Paginated list of notification records",
      ),
    },
  }),
  handler: async (c) => {
    const query = c.req.valid("query");
    const result = await listNotificationRecords(query);
    return c.json(result, 200);
  },
});
