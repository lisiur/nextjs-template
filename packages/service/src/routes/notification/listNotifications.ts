import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { listUserNotifications } from "#services/notification/notification-query.service";
import { assertPermission } from "#services/role-permission.service";
import {
  listNotificationsQuerySchema,
  listNotificationsResponseSchema,
} from "./schema";

export const listNotificationsRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Notification"],
    summary: "List current user's in-app notifications",
    request: { query: listNotificationsQuerySchema },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(listNotificationsResponseSchema, "User notifications"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification::list");
    const query = c.req.valid("query");
    const result = await listUserNotifications({
      userId: session.user.id,
      limit: query.limit,
      offset: query.offset,
      unreadOnly: query.unreadOnly,
    });
    return c.json(result, 200);
  },
});
