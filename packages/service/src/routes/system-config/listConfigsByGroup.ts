import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { assertPermission } from "#services/role-permission.service";
import { listConfigsByGroup } from "#services/system-config.service";
import { getConfigsByGroupParamSchema, systemConfigItemSchema } from "./schema";

export const listConfigsByGroupRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{group}",
    tags: ["SystemConfig"],
    summary: "List configurations by group",
    description: "Returns all system configurations for a specific group.",
    request: {
      params: getConfigsByGroupParamSchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(
        systemConfigItemSchema.array(),
        "List of system configurations for the group",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "system-config::listByGroup");
    const { group } = c.req.valid("param");
    const configs = await listConfigsByGroup(group);
    return c.json(configs, 200);
  },
});
