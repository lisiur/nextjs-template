import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { logAudit } from "#lib/logger";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { upsertConfig } from "#services/system-config.service";
import { prepend } from "#utils/list";
import {
  errorSchema,
  systemConfigItemSchema,
  upsertConfigBodySchema,
  upsertConfigParamSchema,
} from "./schema";

export const upsertConfigRoute = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("system-config::upsert")),
    method: "put",
    path: "/{group}/{key}",
    tags: ["SystemConfig"],
    summary: "Upsert a configuration",
    description: "Create or update a system configuration item.",
    request: {
      params: upsertConfigParamSchema,
      body: {
        content: {
          "application/json": {
            schema: upsertConfigBodySchema,
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
            schema: systemConfigItemSchema,
          },
        },
        description: "The upserted configuration",
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
    const { group, key } = c.req.valid("param");
    const body = c.req.valid("json");

    const config = await upsertConfig(group, key, body);

    await logAudit({
      event: "system_config.updated",
      category: "system_config",
      targetName: `${group}.${key}`,
      c,
    });

    return c.json(config, 200);
  },
});
