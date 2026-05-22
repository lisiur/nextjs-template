import { OpenAPIHono } from "@hono/zod-openapi";
import { getApplication } from "./getApplication";
import { getCurrentApplication } from "./getCurrentApplication";
import { listApplications } from "./listApplications";
import { updateApplication } from "./updateApplication";

const applicationRoutes = new OpenAPIHono();

const routes = applicationRoutes.openapiRoutes([
  listApplications,
  getCurrentApplication,
  getApplication,
  updateApplication,
] as const);

export { routes as applicationRoutes };
