import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { getPrincipalUserId, requirePrincipal } from "#extractors/session";
import { okResponseFn, unauthorizedResponse } from "#lib/openapi";
import { updateUser as updateUserService } from "#services/auth.service";
import { updateUserBodySchema, userMutationResponseSchema } from "./schema";

export const updateUser = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/update-user",
    tags: ["Auth"],
    summary: "Update current user profile",
    request: {
      body: {
        content: { "application/json": { schema: updateUserBodySchema } },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...okResponseFn(userMutationResponseSchema, "Updated user"),
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);
    const body = c.req.valid("json");
    const { user } = await updateUserService({
      userId: getPrincipalUserId(principal),
      data: body,
    });

    return c.json({ user }, 200);
  },
});
