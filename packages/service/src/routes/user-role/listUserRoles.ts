import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { assertPermission } from "#services/role-permission.service";
import { listUserRoles as listUserRolesSvc } from "#services/user-role.service";
import { listUserRolesQuerySchema, userRoleSchema } from "./schema";

export const listUserRoles = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["UserRole"],
    summary: "List roles for a user",
    request: {
      query: listUserRolesQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(userRoleSchema.array(), "User roles"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "user-role::list");
    const { scopeId, scopeType, userId } = c.req.valid("query");
    const userRoles = await listUserRolesSvc(userId, { scopeId, scopeType });
    return c.json(userRoles, 200);
  },
});
