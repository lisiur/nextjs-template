import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { logAudit } from "#lib/logger";
import {
  createdResponseFn,
  forbiddenResponse,
  unauthorizedResponse,
} from "#lib/openapi";
import { createApplication as createApplicationService } from "#services/application.service";
import { assertPermission } from "#services/role-permission.service";
import {
  applicationSchema,
  createApplicationBodySchema,
  errorSchema,
} from "./schema";

export const createApplication = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/",
    tags: ["Application"],
    summary: "Create an application",
    description: "Create a new application.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createApplicationBodySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      ...createdResponseFn(applicationSchema, "The created application"),
      409: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Application code already exists",
      },
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "application::create");
    const body = c.req.valid("json");
    const app = await createApplicationService(body);

    logAudit({
      event: "application.created",
      category: "application",
      targetId: app.id,
      targetName: app.name,
      c,
    });

    return c.json(app, 201);
  },
});
