import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireCurrentApp } from "#extractors/current-app";
import { forbiddenResponse, unauthorizedResponse } from "#lib/openapi";
import { requirePermission } from "#middleware/require-permission";
import { prepend } from "#utils/list";
import { applicationSchema, errorSchema } from "./schema";

export const getCurrentApplication = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requirePermission("application::view")),
    method: "get",
    path: "/current",
    tags: ["Application"],
    summary: "Get current application",
    description: "Returns the application resolved from the X-App-Code header.",
    responses: {
      ...unauthorizedResponse,

      ...forbiddenResponse,
      200: {
        content: {
          "application/json": { schema: applicationSchema },
        },
        description: "The current application",
      },
      400: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Missing X-App-Code header",
      },
      404: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Application not found",
      },
    },
  }),
  handler: async (c) => {
    const app = await requireCurrentApp(c);
    return c.json(app, 200);
  },
});
