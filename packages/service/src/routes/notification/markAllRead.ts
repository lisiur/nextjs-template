import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  successSchema,
  unauthorizedResponse,
} from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { markAllNotificationsRead } from "#services/notification/notification-query.service";
import { prepend } from "#utils/list";

export const markAllReadRoute = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("notification::view")),
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
    await markAllNotificationsRead(session.user.id);
    return c.json({ success: true }, 200);
  },
});
