import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { okResponseFn, successSchema } from "#lib/openapi";
import { deleteSessionCookie, getSessionTokenFromContext } from "#lib/session";
import { signOut as signOutService } from "#services/auth.service";

export const signOut = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/sign-out",
    tags: ["Auth"],
    summary: "Sign out current session",
    responses: {
      ...okResponseFn(successSchema, "Signed out"),
    },
  }),
  handler: async (c) => {
    await signOutService(getSessionTokenFromContext(c), c.get("traceId"));
    deleteSessionCookie(c);
    return c.json({ success: true }, 200);
  },
});
