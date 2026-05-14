import { OpenAPIHono } from "@hono/zod-openapi";
import { authRoutes } from "./auth.routes";

const routes = new OpenAPIHono().route("/auth", authRoutes);

export { routes };
