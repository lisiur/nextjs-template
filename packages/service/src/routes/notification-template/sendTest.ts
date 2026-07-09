import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireAppId } from "#extractors/app-id";
import { requireSession } from "#extractors/session";
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { createNotificationsFromTemplate } from "#services/notification/notification.service";
import { getNotificationTemplate } from "#services/notification/template.service";
import { assertPermission } from "#services/role-permission.service";
import {
  notificationTemplateIdParamSchema,
  sendTestNotificationBodySchema,
  sendTestNotificationResponseSchema,
} from "./schema";

export const sendTestNotificationRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/{id}/send-test",
    tags: ["NotificationTemplate"],
    summary: "Send a test notification from a template",
    request: {
      params: notificationTemplateIdParamSchema,
      body: {
        content: {
          "application/json": { schema: sendTestNotificationBodySchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      ...badRequestResponse,
      ...okResponseFn(
        sendTestNotificationResponseSchema,
        "Test notification result",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-template::test");
    const appId = await requireAppId(c);
    const { id } = c.req.valid("param");
    const { recipientUserId, variables } = c.req.valid("json");

    const template = await getNotificationTemplate(id);

    const result = await createNotificationsFromTemplate({
      templateKey: template.key,
      recipientUserIds: [recipientUserId],
      appId,
      variables,
      creatorId: session.user.id,
      source: "admin.test",
    });

    return c.json(result, 200);
  },
});
