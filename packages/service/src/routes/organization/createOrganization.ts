import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { logAudit } from "#lib/logger";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { createOrganization as createOrganizationService } from "#services/organization.service";
import { prepend } from "#utils/list";
import {
  createOrganizationBodySchema,
  errorSchema,
  organizationSchema,
} from "./schema";

export const createOrganization = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("organization::create")),
    method: "post",
    path: "/",
    tags: ["Organization"],
    summary: "Create an organization",
    description: "Create a new organization.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createOrganizationBodySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      201: {
        content: {
          "application/json": { schema: organizationSchema },
        },
        description: "The created organization",
      },
      409: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Slug already taken",
      },
    },
  }),
  handler: async (c) => {
    const body = c.req.valid("json");
    const org = await createOrganizationService(body);

    logAudit({
      event: "organization.created",
      category: "organization",
      targetId: org.id,
      targetName: org.name,
      c,
    });

    return c.json(org, 201);
  },
});
