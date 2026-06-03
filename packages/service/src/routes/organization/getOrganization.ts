import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { getOrganizationById } from "#services/organization.service";
import { prepend } from "#utils/list";
import {
  errorSchema,
  organizationIdParamSchema,
  organizationSchema,
} from "./schema";

export const getOrganization = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("organization::view")),
    method: "get",
    path: "/{id}",
    tags: ["Organization"],
    summary: "Get an organization",
    description: "Returns a single organization by ID.",
    request: {
      params: organizationIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": { schema: organizationSchema },
        },
        description: "The organization",
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
    const org = await getOrganizationById(id);
    return c.json(org, 200);
  },
});
