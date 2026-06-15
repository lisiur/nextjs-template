import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { listApplications as listApplicationsService } from "#services/application.service";
import { assertPermission } from "#services/role-permission.service";
import {
  listApplicationsQuerySchema,
  listApplicationsResponseSchema,
} from "./schema";

export const listApplications = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Application"],
    summary: "List all applications",
    description:
      "Returns a paginated list of applications with optional search.",
    request: {
      query: listApplicationsQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      ...okResponseFn(
        listApplicationsResponseSchema,
        "Paginated list of applications",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "application::list");
    const { search, limit, offset } = c.req.valid("query");
    const result = await listApplicationsService({ search, limit, offset });
    return c.json(result, 200);
  },
});
