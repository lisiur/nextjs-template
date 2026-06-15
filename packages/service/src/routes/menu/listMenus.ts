import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { listMenus as listMenusService } from "#services/menu.service";
import { assertPermission } from "#services/role-permission.service";
import { listMenusQuerySchema, listMenusResponseSchema } from "./schema";

export const listMenus = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Menu"],
    summary: "List menus",
    description:
      "Returns a flat list of menus for the given appId, sorted by sortOrder.",
    request: {
      query: listMenusQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(listMenusResponseSchema, "Flat list of menus"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "menu::list");
    const { appId } = c.req.valid("query");

    const result = await listMenusService(appId);

    return c.json(result, 200);
  },
});
