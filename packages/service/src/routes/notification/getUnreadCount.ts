import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { okResponseFn, unauthorizedResponse } from "#lib/openapi";
import { getUserUnreadCount } from "#services/notification/notification-query.service";
import { unreadCountResponseSchema } from "./schema";

export const getUnreadCountRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/unread-count",
    tags: ["Notification"],
    summary: "Get unread notification count",
    responses: {
      ...unauthorizedResponse,
      ...okResponseFn(unreadCountResponseSchema, "Unread count"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    const count = await getUserUnreadCount(session.user.id);
    return c.json({ count }, 200);
  },
});
