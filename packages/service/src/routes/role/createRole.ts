import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { logAudit } from "#lib/logger";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { createRole as createRoleService } from "#services/role.service";
import { prepend } from "#utils/list";
import { createRoleBodySchema, errorSchema, roleSchema } from "./schema";

export const createRole = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("role::create")),
    method: "post",
    path: "/",
    tags: ["Role"],
    summary: "Create a role",
    request: {
      body: {
        content: {
          "application/json": { schema: createRoleBodySchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      201: {
        content: { "application/json": { schema: roleSchema } },
        description: "Created role",
      },
      400: {
        content: { "application/json": { schema: errorSchema } },
        description: "Bad Request",
      },
    },
  }),
  handler: async (c) => {
    const data = c.req.valid("json");
    const role = await createRoleService(data);

    logAudit({
      event: "role.created",
      category: "role",
      targetId: role.id,
      targetName: role.name,
      c,
    });

    return c.json(role, 201);
  },
});
