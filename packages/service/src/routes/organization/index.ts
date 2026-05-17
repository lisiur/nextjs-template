import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { createOrganization } from "./createOrganization";
import { deleteOrganization } from "./deleteOrganization";
import { getOrganization } from "./getOrganization";
import { listOrganizations } from "./listOrganizations";
import { updateOrganization } from "./updateOrganization";

const organizationRoutes = new OpenAPIHono();

organizationRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

const routes = organizationRoutes.openapiRoutes([
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
] as const);

export { routes as organizationRoutes };
