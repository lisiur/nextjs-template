import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { listNotificationChannels } from "#services/notification/channel.service";
import { assertPermission } from "#services/role-permission.service";
import {
  listNotificationChannelsQuerySchema,
  listNotificationChannelsResponseSchema,
} from "./schema";

export const listNotificationChannelsRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["NotificationChannel"],
    summary: "List notification channels",
    request: { query: listNotificationChannelsQuerySchema },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(
        listNotificationChannelsResponseSchema,
        "Notification channels",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-channel::list");
    const query = c.req.valid("query");
    const channels = await listNotificationChannels(query);
    return c.json({ channels }, 200);
  },
});
