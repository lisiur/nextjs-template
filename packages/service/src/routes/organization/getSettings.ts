import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requirePrincipal } from "#extractors/session";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { getOrganizationById } from "#services/organization.service";
import { assertAccess } from "#services/role-permission.service";
import { organizationIdParamSchema, organizationSchema } from "./schema";

export const getOrganizationSettings = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}/settings",
    tags: ["Organization"],
    summary: "Get organization settings",
    description:
      "Returns the settings for an organization. Requires organization-settings::view for this organization.",
    request: {
      params: organizationIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      ...okResponseFn(organizationSchema, "The organization settings"),
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);
    const { id } = c.req.valid("param");

    await assertAccess(principal, "organization-settings::view", {
      appId: "organization",
      organizationId: id,
    });

    const org = await getOrganizationById(id);
    return c.json(org, 200);
  },
});
