import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { createMiddleware } from "hono/factory";
import { requireCurrentApp } from "#extractors/current-app";
import { requireSession } from "#extractors/session";
import {
  badRequestResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { prepend } from "#utils/list";
import { currentApplicationSchema, errorSchema } from "./schema";

const requireAuthenticatedSession = createMiddleware(async (c, next) => {
  await requireSession(c);
  return next();
});

export const getCurrentApplication = defineOpenAPIRoute({
  route: createRoute({
    middleware: prepend([], requireAuthenticatedSession),
    method: "get",
    path: "/current",
    tags: ["Application"],
    summary: "Get current application",
    description: "Returns the application resolved from the X-App-Code header.",
    responses: {
      ...unauthorizedResponse,
      ...okResponseFn(currentApplicationSchema, "The current application"),
      ...badRequestResponse,
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
    return c.json(
      {
        name: app.name,
        code: app.code,
        description: app.description,
        logo: app.logo,
      },
      200,
    );
  },
});
