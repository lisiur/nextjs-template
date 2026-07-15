import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requirePrincipal } from "#extractors/session";
import { logAudit } from "#lib/logger";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { deleteApplication as deleteApplicationService } from "#services/application.service";
import { assertAccess } from "#services/role-permission.service";
import { applicationIdParamSchema, deleteSuccessSchema } from "./schema";

export const deleteApplication = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Application"],
    summary: "Delete an application",
    description: "Soft-delete an application by ID.",
    request: {
      params: applicationIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      ...okResponseFn(deleteSuccessSchema, "Successfully deleted"),
      ...notFoundResponse,
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);
    await assertAccess(principal, "application::delete");
    const { id } = c.req.valid("param");

    const app = await deleteApplicationService(id);

    logAudit({
      event: "application.deleted",
      category: "application",
      targetId: id,
      targetName: app.name,
      c,
    });

    return c.json({ success: true as const }, 200);
  },
});
