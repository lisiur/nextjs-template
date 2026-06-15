import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { getNotificationTemplate } from "#services/notification/template.service";
import { assertPermission } from "#services/role-permission.service";
import {
  notificationTemplateIdParamSchema,
  notificationTemplateSchema,
} from "./schema";

export const getNotificationTemplateRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["NotificationTemplate"],
    summary: "Get a notification template",
    request: { params: notificationTemplateIdParamSchema },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      ...okResponseFn(notificationTemplateSchema, "Notification template"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-template::view");
    const { id } = c.req.valid("param");
    const template = await getNotificationTemplate(id);
    return c.json(template, 200);
  },
});
