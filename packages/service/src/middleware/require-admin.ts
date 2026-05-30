import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getSession } from "#services/auth.service";

export const requireAdmin = createMiddleware(async (c, next) => {
  const session = await getSession(c.req.raw.headers);
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});
