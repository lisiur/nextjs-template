import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { logAudit } from "#lib/logger";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { updateMenu as updateMenuService } from "#services/menu.service";
import { prepend } from "#utils/list";
import {
  errorSchema,
  menuIdParamSchema,
  menuSchema,
  updateMenuBodySchema,
} from "./schema";

export const updateMenu = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("menu::update")),
    method: "put",
    path: "/{id}",
    tags: ["Menu"],
    summary: "Update a menu",
    description: "Update a menu by ID.",
    request: {
      params: menuIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: updateMenuBodySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": { schema: menuSchema },
        },
        description: "The updated menu",
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
    const body = c.req.valid("json");

    const menu = await updateMenuService(id, body);

    logAudit({
      event: "menu.updated",
      category: "menu",
      targetId: menu.id,
      targetName: menu.name,
      c,
    });

    return c.json(menu, 200);
  },
});
