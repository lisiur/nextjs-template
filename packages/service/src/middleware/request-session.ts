import { createMiddleware } from "hono/factory";
import { getSessionTokenFromHeaders } from "#lib/session";
import { getSession } from "#services/auth.service";

export const requestSession = createMiddleware(async (c, next) => {
  const token = getSessionTokenFromHeaders(c.req.raw.headers);
  if (!token) {
    c.set("session", null);
  } else {
    const session = await getSession(c.req.raw.headers);
    c.set("session", session);
  }
  return next();
});
