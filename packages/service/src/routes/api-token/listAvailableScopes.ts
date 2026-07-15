import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { okResponseFn, unauthorizedResponse } from "#lib/openapi";
import { getUserPermissionCatalog } from "#services/role-permission.service";
import { listAvailableScopesResponseSchema } from "./schema";

export const listAvailableScopes = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/available-scopes",
    tags: ["API Token"],
    summary: "List available scopes",
    description:
      "Returns the permissions the current user holds, which can be granted to a new API token.",
    responses: {
      ...unauthorizedResponse,
      ...okResponseFn(
        listAvailableScopesResponseSchema,
        "Permissions available as token scopes",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    const scopes = await getUserPermissionCatalog(session.user.id);
    return c.json({ scopes }, 200);
  },
});
