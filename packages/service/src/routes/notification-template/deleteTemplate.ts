import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requirePrincipal } from "#extractors/session";
import {
  deleteSuccessSchema,
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { deleteNotificationTemplate } from "#services/notification/template.service";
import { assertAccess } from "#services/role-permission.service";
import { notificationTemplateIdParamSchema } from "./schema";

export const deleteNotificationTemplateRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["NotificationTemplate"],
    summary: "Delete a notification template",
    request: { params: notificationTemplateIdParamSchema },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      ...okResponseFn(deleteSuccessSchema, "Deleted notification template"),
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);
    await assertAccess(principal, "notification-template::delete");
    const { id } = c.req.valid("param");
    const result = await deleteNotificationTemplate(id);
    return c.json(result, 200);
  },
});
