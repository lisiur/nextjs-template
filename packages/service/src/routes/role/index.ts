import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { createRole } from "./createRole";
import { deleteRole } from "./deleteRole";
import { listRoles } from "./listRoles";
import { updateRole } from "./updateRole";

const roleRoutes = new OpenAPIHono();

roleRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

const routes = roleRoutes.openapiRoutes([
  listRoles,
  createRole,
  updateRole,
  deleteRole,
] as const);

export { routes as roleRoutes };
