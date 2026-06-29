import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { getPositionPermissions } from "#services/position.service";
import { assertPermission } from "#services/role-permission.service";
import {
  orgIdParamSchema,
  positionIdParamSchema,
  positionPermissionsResponseSchema,
} from "./schema";

export const getPositionPermissionsRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{orgId}/positions/{id}/permissions",
    tags: ["Position"],
    summary: "Get position permissions",
    description:
      "Returns the permissions assigned to a position and all available org permissions.",
    request: {
      params: orgIdParamSchema.merge(positionIdParamSchema),
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      ...okResponseFn(
        positionPermissionsResponseSchema,
        "Assigned and available permissions",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    const { orgId, id } = c.req.valid("param");

    await assertPermission(session.user.id, "position-permission::manage", {
      appId: "organization",
      organizationId: orgId,
    });

    const result = await getPositionPermissions(orgId, id);
    return c.json(result, 200);
  },
});
