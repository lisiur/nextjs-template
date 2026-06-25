import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { getOrganizationById } from "#services/organization.service";
import { assertPermission } from "#services/role-permission.service";
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
    const session = await requireSession(c);
    const { id } = c.req.valid("param");

    await assertPermission(session.user.id, "organization-settings::view", {
      appId: "organization",
      organizationId: id,
    });

    const org = await getOrganizationById(id);
    return c.json(org, 200);
  },
});
