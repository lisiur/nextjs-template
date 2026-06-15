import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { updateNotificationChannel } from "#services/notification/channel.service";
import { assertPermission } from "#services/role-permission.service";
import {
  notificationChannelIdParamSchema,
  notificationChannelSchema,
  updateNotificationChannelBodySchema,
} from "./schema";

export const updateNotificationChannelRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "put",
    path: "/{id}",
    tags: ["NotificationChannel"],
    summary: "Update a notification channel",
    request: {
      params: notificationChannelIdParamSchema,
      body: {
        content: {
          "application/json": { schema: updateNotificationChannelBodySchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...badRequestResponse,
      ...notFoundResponse,
      ...okResponseFn(
        notificationChannelSchema,
        "Updated notification channel",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-channel::update");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const channel = await updateNotificationChannel(id, body);
    return c.json(channel, 200);
  },
});
