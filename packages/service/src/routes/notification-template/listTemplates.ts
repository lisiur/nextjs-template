import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { listNotificationTemplates } from "#services/notification/template.service";
import { assertPermission } from "#services/role-permission.service";
import {
  listNotificationTemplatesQuerySchema,
  listNotificationTemplatesResponseSchema,
} from "./schema";

export const listNotificationTemplatesRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["NotificationTemplate"],
    summary: "List notification templates",
    request: { query: listNotificationTemplatesQuerySchema },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(
        listNotificationTemplatesResponseSchema,
        "Notification templates",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "notification-template::list");
    const query = c.req.valid("query");
    const templates = await listNotificationTemplates(query);
    return c.json({ templates }, 200);
  },
});
