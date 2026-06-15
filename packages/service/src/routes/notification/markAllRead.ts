import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  successSchema,
  unauthorizedResponse,
} from "#lib/openapi";
import { markAllNotificationsRead } from "#services/notification/notification-query.service";
import { assertPermission } from "#services/role-permission.service";

export const markAllReadRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "patch",
    path: "/read-all",
    tags: ["Notification"],
    summary: "Mark all notifications as read",
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(successSchema, "All marked as read"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification::view");
    await markAllNotificationsRead(session.user.id);
    return c.json({ success: true }, 200);
  },
});
