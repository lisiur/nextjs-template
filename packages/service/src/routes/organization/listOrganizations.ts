import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { listOrganizations as listOrganizationsService } from "#services/organization.service";
import { prepend } from "#utils/list";
import {
  listOrganizationsQuerySchema,
  listOrganizationsResponseSchema,
} from "./schema";

export const listOrganizations = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("organization::list")),
    method: "get",
    path: "/",
    tags: ["Organization"],
    summary: "List all organizations",
    description: "Returns a paginated list of all organizations.",
    request: {
      query: listOrganizationsQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": {
            schema: listOrganizationsResponseSchema,
          },
        },
        description: "Paginated list of organizations",
      },
    },
  }),
  handler: async (c) => {
    const { limit, offset } = c.req.valid("query");
    const result = await listOrganizationsService({ limit, offset });
    return c.json(result, 200);
  },
});
