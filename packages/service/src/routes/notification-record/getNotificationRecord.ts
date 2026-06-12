import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { getNotificationRecordById } from "#services/notification-record.service";
import { prepend } from "#utils/list";
import { idParamSchema, notificationRecordSchema } from "./schema";

export const getNotificationRecordRoute = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("notification-record::view")),
    method: "get",
    path: "/{id}",
    tags: ["NotificationRecord"],
    summary: "Get a notification record",
    description: "Returns a single notification record by ID for admin review.",
    request: { params: idParamSchema() },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(notificationRecordSchema, "The notification record"),
      ...notFoundResponse,
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const record = await getNotificationRecordById(id);
    return c.json(record, 200);
  },
});
