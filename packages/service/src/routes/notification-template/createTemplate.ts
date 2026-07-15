import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requirePrincipal } from "#extractors/session";
import {
  badRequestResponse,
  createdResponseFn,
  forbiddenResponse,
  unauthorizedResponse,
} from "#lib/openapi";
import { createNotificationTemplate } from "#services/notification/template.service";
import { assertAccess } from "#services/role-permission.service";
import {
  createNotificationTemplateBodySchema,
  notificationTemplateSchema,
} from "./schema";

export const createNotificationTemplateRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/",
    tags: ["NotificationTemplate"],
    summary: "Create a notification template",
    request: {
      body: {
        content: {
          "application/json": { schema: createNotificationTemplateBodySchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...badRequestResponse,
      ...createdResponseFn(
        notificationTemplateSchema,
        "Created notification template",
      ),
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);
    await assertAccess(principal, "notification-template::create");
    const body = c.req.valid("json");
    const template = await createNotificationTemplate(body);
    return c.json(template, 201);
  },
});
