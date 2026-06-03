import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { logAudit } from "#lib/logger";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { batchUpsertConfigs } from "#services/system-config.service";
import { prepend } from "#utils/list";
import {
  batchUpsertBodySchema,
  errorSchema,
  systemConfigItemSchema,
} from "./schema";

export const batchUpsertConfigsRoute = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("system-config::batchUpsert")),
    method: "put",
    path: "/batch",
    tags: ["SystemConfig"],
    summary: "Batch upsert configurations",
    description:
      "Create or update multiple system configuration items at once.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: batchUpsertBodySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": {
            schema: systemConfigItemSchema.array(),
          },
        },
        description: "The upserted configurations",
      },
      400: {
        content: {
          "application/json": {
            schema: errorSchema,
          },
        },
        description: "Validation error",
      },
    },
  }),
  handler: async (c) => {
    const { items } = c.req.valid("json");

    const configs = await batchUpsertConfigs(items);

    await logAudit({
      event: "system_config.batch_updated",
      category: "system_config",
      metadata: {
        keys: items.map(
          (i: { group: string; key: string }) => `${i.group}.${i.key}`,
        ),
      },
      c,
    });

    return c.json(configs, 200);
  },
});
