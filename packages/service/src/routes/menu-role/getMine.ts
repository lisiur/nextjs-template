import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { menuRoleRepository } from "../../repositories/menu-role.repository";
import { errorSchema, mineMenusResponseSchema } from "./schema";

export const getMine = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/mine",
    tags: ["Menu"],
    summary: "Get current user's authorized menus",
    description:
      "Returns menus authorized for the current user's role. Any authenticated user can call this endpoint.",
    responses: {
      200: {
        content: {
          "application/json": { schema: mineMenusResponseSchema },
        },
        description: "Menus authorized for the current user",
      },
      401: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user || !session.user.role) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const menus = await menuRoleRepository.getMenusForRole(session.user.role);
    return c.json({ menus }, 200);
  },
});
