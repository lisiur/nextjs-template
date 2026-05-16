import { OpenAPIHono } from "@hono/zod-openapi";
import { authRoutes } from "./auth.routes";
import { systemConfigRoutes } from "./system-config";

const routes = new OpenAPIHono()
  .route("/auth", authRoutes)
  .route("/system-config", systemConfigRoutes);

export { routes };
