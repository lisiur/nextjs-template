import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { listUserNotifications } from "#services/notification/notification-query.service";
import { prepend } from "#utils/list";
import {
  listNotificationsQuerySchema,
  listNotificationsResponseSchema,
} from "./schema";

export const listNotificationsRoute = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("notification::list")),
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
