import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { logAudit } from "#lib/logger";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { updateOrganization as updateOrganizationService } from "#services/organization.service";
import { assertPermission } from "#services/role-permission.service";
import {
  errorSchema,
  organizationIdParamSchema,
  organizationSchema,
  updateOrganizationBodySchema,
} from "./schema";

export const updateOrganization = defineOpenAPIRoute({
  route: createRoute({
    method: "put",
    path: "/{id}",
    tags: ["Organization"],
    summary: "Update an organization",
    description: "Update an organization by ID.",
    request: {
      params: organizationIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: updateOrganizationBodySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      ...notFoundResponse,
      409: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Slug already taken",
      },
      ...okResponseFn(organizationSchema, "The updated organization"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "organization::update");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const org = await updateOrganizationService(id, body);

    logAudit({
      event: "organization.updated",
      category: "organization",
      targetId: org.id,
      targetName: org.name,
      c,
    });

    return c.json(org, 200);
  },
});
