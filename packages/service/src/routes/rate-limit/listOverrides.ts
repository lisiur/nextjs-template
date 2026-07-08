import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  forbiddenResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { listOverrides } from "#services/rate-limit.service";
import { assertPermission } from "#services/role-permission.service";
import { rateLimitOverrideItemSchema } from "./schema";

export const listOverridesRoute = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/overrides",
    tags: ["RateLimit"],
    summary: "List rate-limit overrides",
    description:
      "Returns all configured override rules (whitelist / custom policy per IP or user).",
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...okResponseFn(
        rateLimitOverrideItemSchema.array(),
        "List of rate-limit overrides",
      ),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    await assertPermission(session.user.id, "rate-limit::manage");
    const overrides = await listOverrides();
    return c.json(overrides, 200);
  },
});
