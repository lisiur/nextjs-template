import { OpenAPIHono } from "@hono/zod-openapi";
import { applicationRoutes } from "./application";
import { authRoutes } from "./auth.routes";
import { menuRoutes } from "./menu";
import { menuRoleRoutes } from "./menu-role";
import { organizationRoutes } from "./organization";
import { roleRoutes } from "./role";
import { systemConfigRoutes } from "./system-config";
import { systemInfoRoutes } from "./system-info";
import { uploadRoutes } from "./upload";
import { userRoleRoutes } from "./user-role";

const routes = new OpenAPIHono()
  .route("/auth", authRoutes)
  .route("/system-config", systemConfigRoutes)
  .route("/organizations", organizationRoutes)
  .route("/applications", applicationRoutes)
  .route("/menu", menuRoutes)
  .route("/menu-role", menuRoleRoutes)
  .route("/roles", roleRoutes)
  .route("/system-info", systemInfoRoutes)
  .route("/upload", uploadRoutes)
  .route("/user-role", userRoleRoutes);

export { routes };
