import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { userRoleRepository } from "../../repositories/user-role.repository";
import { errorSchema, removeUserRoleParamSchema } from "./schema";

export const removeUserRole = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/{userId}/{roleId}",
    tags: ["UserRole"],
    summary: "Remove a role from a user",
    request: {
      params: removeUserRoleParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { success: { type: "boolean" } },
            },
          },
        },
        description: "Removed",
      },
    },
  }),
  handler: async (c) => {
    const { userId, roleId } = c.req.valid("param");
    await userRoleRepository.remove(userId, roleId);
    return c.json({ success: true }, 200);
  },
});
