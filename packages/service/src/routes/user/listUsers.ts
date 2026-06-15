import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { assertPermission } from "#services/role-permission.service";
import { listUsers as listUsersSvc } from "#services/user.service";
import { listUsersQuerySchema, listUsersResponseSchema } from "./schema";

export const listUsers = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["AdminUser"],
    summary: "List users with custom roles",
    request: {
      query: listUsersQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(listUsersResponseSchema, "List of users"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "user::list");
    const { limit, offset } = c.req.valid("query");
    const result = await listUsersSvc(limit, offset);
    return c.json(result, 200);
  },
});
