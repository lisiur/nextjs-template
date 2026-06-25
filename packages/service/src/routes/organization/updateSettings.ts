import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { logAudit } from "#lib/logger";
import {
  errorSchema,
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { updateOrganization as updateOrganizationService } from "#services/organization.service";
import { assertPermission } from "#services/role-permission.service";
import {
  organizationIdParamSchema,
  organizationSchema,
  updateOrganizationBodySchema,
} from "./schema";

export const updateOrganizationSettings = defineOpenAPIRoute({
  route: createRoute({
    method: "put",
    path: "/{id}/settings",
    tags: ["Organization"],
    summary: "Update organization settings",
    description:
      "Updates an organization's settings. Requires organization-settings::update for this organization.",
    request: {
      params: organizationIdParamSchema,
      body: {
        content: {
          "application/json": { schema: updateOrganizationBodySchema },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      409: {
        content: { "application/json": { schema: errorSchema } },
        description: "Slug already taken",
      },
      ...okResponseFn(organizationSchema, "The updated organization"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    await assertPermission(session.user.id, "organization-settings::update", {
      appId: "organization",
      organizationId: id,
    });

    const org = await updateOrganizationService(id, body);

    await logAudit({
      event: "organization.settings.updated",
      category: "organization",
      targetType: "organization",
      targetId: org.id,
      targetName: org.name,
      c,
    });

    return c.json(org, 200);
  },
});
