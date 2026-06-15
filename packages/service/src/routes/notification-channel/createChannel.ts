import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  badRequestResponse,
  createdResponseFn,
  forbiddenResponse,
  unauthorizedResponse,
} from "#lib/openapi";
import { createNotificationChannel } from "#services/notification/channel.service";
import { assertPermission } from "#services/role-permission.service";
import {
  createNotificationChannelBodySchema,
  notificationChannelSchema,
} from "./schema";

export const createNotificationChannelRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/",
    tags: ["NotificationChannel"],
    summary: "Create a notification channel",
    request: {
      body: {
        content: {
          "application/json": { schema: createNotificationChannelBodySchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...badRequestResponse,
      ...createdResponseFn(
        notificationChannelSchema,
        "Created notification channel",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-channel::create");
    const body = c.req.valid("json");
    const channel = await createNotificationChannel(body);
    return c.json(channel, 201);
  },
});
