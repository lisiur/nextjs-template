import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { logAudit } from "#lib/logger";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { assertPermission } from "#services/role-permission.service";
import { removeUserRole as removeUserRoleSvc } from "#services/user-role.service";
import { removeUserRoleParamSchema, successResponseSchema } from "./schema";

export const removeUserRole = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/remove",
    tags: ["UserRole"],
    summary: "Remove a role from a user",
    request: {
      body: {
        content: {
          "application/json": { schema: removeUserRoleParamSchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(successResponseSchema, "Removed"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "user-role::remove");
    const { roleId, scopeId, scopeType, userId } = c.req.valid("json");
    await removeUserRoleSvc(userId, roleId, { scopeId, scopeType });

    logAudit({
      event: "user_role.removed",
      category: "user_role",
      metadata: { userId, roleId, scopeType, scopeId },
      c,
    });

    return c.json({ success: true }, 200);
  },
});
