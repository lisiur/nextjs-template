import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { getPrincipalUserId, requirePrincipal } from "#extractors/session";
import { okResponseFn, unauthorizedResponse } from "#lib/openapi";
import { getUserAppMenus } from "#services/user-role.service";
import { mineMenusResponseSchema } from "./schema";

export const getUserAppRoles = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/mine",
    tags: ["RoleAssignment"],
    summary: "Get current user's menus from all app-scoped roles",
    responses: {
      ...unauthorizedResponse,
      ...okResponseFn(
        mineMenusResponseSchema,
        "User's authorized menus across all applications",
      ),
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);

    const menus = await getUserAppMenus(getPrincipalUserId(principal));
    return c.json({ menus }, 200);
  },
});
