import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { getMenuById } from "#services/menu.service";
import { prepend } from "#utils/list";
import { errorSchema, menuIdParamSchema, menuSchema } from "./schema";

export const getMenu = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("menu::view")),
    method: "get",
    path: "/{id}",
    tags: ["Menu"],
    summary: "Get a menu",
    description: "Returns a single menu by ID.",
    request: {
      params: menuIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": { schema: menuSchema },
        },
        description: "The menu",
      },
      404: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Not found",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");

    const menu = await getMenuById(id);

    return c.json(menu, 200);
  },
});
