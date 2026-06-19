import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { logAudit } from "#lib/logger";
import {
  badRequestResponse,
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { assertPermission } from "#services/role-permission.service";
import { assignUserRole as assignUserRoleSvc } from "#services/user-role.service";
import { assignRoleAssignmentBodySchema, roleAssignmentSchema } from "./schema";

export const assignRoleAssignment = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/",
    tags: ["RoleAssignment"],
    summary: "Assign a role to a user",
    request: {
      body: {
        content: {
          "application/json": { schema: assignRoleAssignmentBodySchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...badRequestResponse,
      ...okResponseFn(roleAssignmentSchema, "Assigned role assignment"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "user-role::assign");
    const { roleId, scopeId, scopeType, userId } = c.req.valid("json");
    const roleAssignment = await assignUserRoleSvc(userId, roleId, {
      scopeId,
      scopeType,
    });

    logAudit({
      event: "role_assignment.assigned",
      category: "role_assignment",
      targetId: roleAssignment.id,
      metadata: { userId, roleId, scopeType, scopeId },
      c,
    });

    return c.json(roleAssignment, 200);
  },
});
