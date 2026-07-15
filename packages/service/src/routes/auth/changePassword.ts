import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { getPrincipalUserId, requirePrincipal } from "#extractors/session";
import {
  badRequestResponse,
  okResponseFn,
  unauthorizedResponse,
} from "#lib/openapi";
import { changePassword as changePasswordService } from "#services/auth.service";
import { changePasswordBodySchema, userMutationResponseSchema } from "./schema";

export const changePassword = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/change-password",
    tags: ["Auth"],
    summary: "Change current user password",
    request: {
      body: {
        content: { "application/json": { schema: changePasswordBodySchema } },
        required: true,
      },
    },
    responses: {
      ...unauthorizedResponse,
      ...badRequestResponse,
      ...okResponseFn(userMutationResponseSchema, "Password changed"),
    },
  }),
  handler: async (c) => {
    const principal = await requirePrincipal(c);
    const body = c.req.valid("json");
    const { user } = await changePasswordService({
      userId: getPrincipalUserId(principal),
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    return c.json({ user }, 200);
  },
});
