import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requirePrincipal } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { assertAccess } from "#services/role-permission.service";
import { listUserRoles as listUserRolesSvc } from "#services/user-role.service";
import { listRoleAssignmentsQuerySchema, roleAssignmentSchema } from "./schema";

export const listRoleAssignments = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["RoleAssignment"],
    summary: "List roles for a user",
    request: {
      query: listRoleAssignmentsQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(roleAssignmentSchema.array(), "Role assignments"),
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);
    await assertAccess(principal, "user-role::list");
    const { scopeId, scopeType, userId } = c.req.valid("query");
    const roleAssignments = await listUserRolesSvc(userId, {
      scopeId,
      scopeType,
    });
    return c.json(roleAssignments, 200);
  },
});
