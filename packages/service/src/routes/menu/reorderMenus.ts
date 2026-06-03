import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { reorderMenus as reorderMenusService } from "#services/menu.service";
import { prepend } from "#utils/list";
import {
  errorSchema,
  reorderMenusBodySchema,
  reorderMenusResponseSchema,
} from "./schema";

export const reorderMenus = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("menu::reorder")),
    method: "post",
    path: "/reorder",
    tags: ["Menu"],
    summary: "Reorder menus",
    description:
      "Batch update menu positions after drag-and-drop. Recalculates sortOrder for all siblings atomically.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: reorderMenusBodySchema,
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
          "application/json": { schema: reorderMenusResponseSchema },
        },
        description: "Updated menus with recalculated sortOrder",
      },
      400: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Invalid items",
      },
    },
  }),
  handler: async (c) => {
    const body = c.req.valid("json");

    const result = await reorderMenusService(body.items);

    return c.json(result, 200);
  },
});
