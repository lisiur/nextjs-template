import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { getApplicationById } from "#services/application.service";
import { assertPermission } from "#services/role-permission.service";
import { applicationIdParamSchema, applicationSchema } from "./schema";

export const getApplication = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Application"],
    summary: "Get an application",
    description: "Returns a single application by ID.",
    request: {
      params: applicationIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      ...okResponseFn(applicationSchema, "The application"),
      ...notFoundResponse,
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "application::view");
    const { id } = c.req.valid("param");
    const app = await getApplicationById(id);
    return c.json(app, 200);
  },
});
