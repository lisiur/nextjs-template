import { createMiddleware } from "hono/factory";
import {
  getSessionFromHeaders,
  getSessionTokenFromHeaders,
} from "#lib/session";

export const requestSession = createMiddleware(async (c, next) => {
  const token = getSessionTokenFromHeaders(c.req.raw.headers);
  if (!token) {
    c.set("session", null);
  } else {
    const session = await getSessionFromHeaders(c.req.raw.headers);
    c.set("session", session);
  }
  return next();
});
