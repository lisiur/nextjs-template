import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { getLogById } from "#services/operation-log.service";
import { assertPermission } from "#services/role-permission.service";
import { logIdParamSchema, operationLogSchema } from "./schema";

export const getLog = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Log"],
    summary: "Get a log entry",
    description: "Returns a single operation log by ID.",
    request: {
      params: logIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(operationLogSchema, "The log entry"),
      ...notFoundResponse,
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "operation-log::view");
    const { id } = c.req.valid("param");
    const log = await getLogById(id);
    return c.json(log, 200);
  },
});
