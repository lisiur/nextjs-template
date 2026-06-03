import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { listRoles as listRolesService } from "#services/role.service";
import { prepend } from "#utils/list";
import { listRolesQuerySchema, roleSchema } from "./schema";

export const listRoles = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("role::list")),
    method: "get",
    path: "/",
    tags: ["Role"],
    summary: "List roles for an application",
    request: {
      query: listRolesQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": { schema: roleSchema.array() },
        },
        description: "List of roles",
      },
    },
  }),
  handler: async (c) => {
    const { appId } = c.req.valid("query");
    const roles = await listRolesService(appId);
    return c.json(roles, 200);
  },
});
