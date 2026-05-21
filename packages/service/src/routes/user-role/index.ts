import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { assignUserRole } from "./assignUserRole";
import { getUserAppRoles } from "./getUserAppRoles";
import { listUserRoles } from "./listUserRoles";
import { removeUserRole } from "./removeUserRole";

const adminRoutes = new OpenAPIHono();

adminRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

const publicRoutes = new OpenAPIHono();

const adminPart = adminRoutes.openapiRoutes([
  assignUserRole,
  removeUserRole,
  listUserRoles,
] as const);

const publicPart = publicRoutes.openapiRoutes([getUserAppRoles] as const);

const routes = publicPart.route("/", adminPart);

export { routes as userRoleRoutes };
