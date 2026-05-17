import { OpenAPIHono } from "@hono/zod-openapi";
import { authRoutes } from "./auth.routes";
import { organizationRoutes } from "./organization";
import { systemConfigRoutes } from "./system-config";
import { uploadRoutes } from "./upload";

const routes = new OpenAPIHono()
  .route("/auth", authRoutes)
  .route("/system-config", systemConfigRoutes)
  .route("/organizations", organizationRoutes)
  .route("/upload", uploadRoutes);

export { routes };
