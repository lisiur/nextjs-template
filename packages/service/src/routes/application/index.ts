import { OpenAPIHono } from "@hono/zod-openapi";
import { getApplication } from "./getApplication";
import { getCurrentApplication } from "./getCurrentApplication";
import { listApplications } from "./listApplications";
import { updateApplication } from "./updateApplication";
import { uploadApplicationFaviconRoute } from "./uploadFavicon";
import { uploadApplicationLogoRoute } from "./uploadLogo";

const applicationRoutes = new OpenAPIHono();

const routes = applicationRoutes.openapiRoutes([
  listApplications,
  getCurrentApplication,
  getApplication,
  updateApplication,
  uploadApplicationLogoRoute,
  uploadApplicationFaviconRoute,
] as const);

export { routes as applicationRoutes };
