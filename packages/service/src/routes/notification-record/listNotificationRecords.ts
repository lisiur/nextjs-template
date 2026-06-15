import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { listNotificationRecords } from "#services/notification-record.service";
import { assertPermission } from "#services/role-permission.service";
import {
  listNotificationRecordsQuerySchema,
  listNotificationRecordsResponseSchema,
} from "./schema";

export const listNotificationRecordsRoute = defineOpenAPIRoute({
  route: createRoute({
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
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-record::list");
    const query = c.req.valid("query");
    const result = await listNotificationRecords(query);
    return c.json(result, 200);
  },
});
