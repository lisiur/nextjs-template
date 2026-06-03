import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { deleteUser as deleteUserSvc } from "#services/user.service";
import { prepend } from "#utils/list";
import { errorSchema, successSchema, userIdParamSchema } from "./schema";

export const deleteUser = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("user::delete")),
    method: "delete",
    path: "/{id}",
    tags: ["AdminUser"],
    summary: "Delete a user",
    request: {
      params: userIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: { "application/json": { schema: successSchema } },
        description: "User deleted",
      },
      400: {
        content: { "application/json": { schema: errorSchema } },
        description: "Bad Request",
      },
      403: {
        content: { "application/json": { schema: errorSchema } },
        description: "Forbidden - cannot delete builtin users",
      },
      404: {
        content: { "application/json": { schema: errorSchema } },
        description: "User not found",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const result = await deleteUserSvc(id);
    return c.json(result, 200);
  },
});
