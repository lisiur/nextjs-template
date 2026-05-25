import { OpenAPIHono } from "@hono/zod-openapi";
import { deleteLogs } from "./deleteLogs";
import { getLog } from "./getLog";
import { listLogs } from "./listLogs";

const logRoutesHono = new OpenAPIHono();

const routes = logRoutesHono.openapiRoutes([
  listLogs,
  getLog,
  deleteLogs,
] as const);

export { routes as logRoutes };
