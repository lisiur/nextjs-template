import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { assertPermission } from "#services/role-permission.service";
import { listAllConfigs } from "#services/system-config.service";
import { getConfigsQuerySchema, systemConfigItemSchema } from "./schema";

export const listAllConfigsRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["SystemConfig"],
    summary: "List all system configurations",
    description:
      "Returns all system configurations, optionally filtered by group.",
    request: {
      query: getConfigsQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(
        systemConfigItemSchema.array(),
        "List of system configurations",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "system-config::list");
    const { group } = c.req.valid("query");
    const configs = await listAllConfigs(group);
    return c.json(configs, 200);
  },
});
