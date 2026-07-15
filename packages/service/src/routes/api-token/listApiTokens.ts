import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { requireSession } from "#extractors/session";
import { okResponseFn, unauthorizedResponse } from "#lib/openapi";
import { listApiTokensForUser } from "#services/api-token.service";
import { listApiTokensResponseSchema } from "./schema";

export const listApiTokens = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["API Token"],
    summary: "List my API tokens",
    description: "Returns all API tokens owned by the current user.",
    responses: {
      ...unauthorizedResponse,
      ...okResponseFn(listApiTokensResponseSchema, "Your API tokens"),
    },
  }),
  handler: async (c) => {
    const session = await requireSession(c);
    const tokens = await listApiTokensForUser(session.user.id);
    return c.json({ tokens }, 200);
  },
});
