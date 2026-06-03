import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { appContext } from "#middleware/app-context";
import { operationLogger } from "#middleware/operation-logger";
import { requestSession } from "#middleware/request-session";
import { traceContext } from "#middleware/trace-context";
import { routes } from "./routes";

const openAPIApp = new OpenAPIHono().basePath("/api");

openAPIApp.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ code: err.status, message: err.message }, err.status);
  }
  return c.json({ code: 500, message: "Internal Server Error" }, 500);
});

openAPIApp.use("*", logger());
openAPIApp.use("*", cors());
openAPIApp.use("*", traceContext);
openAPIApp.use("*", requestSession);
openAPIApp.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api/upload")) {
    return next();
  }
  return appContext(c, next);
});
openAPIApp.use("*", operationLogger);

const app = openAPIApp
  .route("/", routes)
  .get("/", (c) => c.json({ message: "Hello world!" }))
  .get(
    "/docs",
    Scalar({
      sources: [{ url: "/api/openapi.json", title: "Main" }],
    }),
  );

openAPIApp.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Next101 API",
    version: "1.0.0",
    description: "Hono REST API with OpenAPI support",
  },
  servers: [{ url: "/api" }],
});

export { app };
