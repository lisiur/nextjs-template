import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import {
  notFoundResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { getApiTokenForUser } from "#services/api-token.service";
import { apiTokenIdParamSchema, apiTokenSchema } from "./schema";

export const getApiToken = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["API Token"],
    summary: "Get an API token",
    description: "Returns a single API token owned by the current user.",
    request: {
      params: apiTokenIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...okResponseFn(apiTokenSchema, "The token"),
      ...notFoundResponse,
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    const { id } = c.req.valid("param");
    const token = await getApiTokenForUser(session.user.id, id);
    return c.json(token, 200);
  },
});
