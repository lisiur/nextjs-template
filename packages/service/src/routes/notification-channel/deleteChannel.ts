import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  deleteSuccessSchema,
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { deleteNotificationChannel } from "#services/notification/channel.service";
import { assertPermission } from "#services/role-permission.service";
import { notificationChannelIdParamSchema } from "./schema";

export const deleteNotificationChannelRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["NotificationChannel"],
    summary: "Delete a notification channel",
    request: { params: notificationChannelIdParamSchema },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      ...okResponseFn(deleteSuccessSchema, "Deleted notification channel"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-channel::delete");
    const { id } = c.req.valid("param");
    const result = await deleteNotificationChannel(id);
    return c.json(result, 200);
  },
});
