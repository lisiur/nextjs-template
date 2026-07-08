import { OpenAPIHono } from "@hono/zod-openapi";
import { deleteOverrideRoute } from "./deleteOverride";
import { getStatusRoute } from "./getStatus";
import { listOverridesRoute } from "./listOverrides";
import { releaseRoute } from "./release";
import { upsertOverrideRoute } from "./upsertOverride";

const rateLimitRoutesHono = new OpenAPIHono();

const routes = rateLimitRoutesHono.openapiRoutes([
  getStatusRoute,
  listOverridesRoute,
  upsertOverrideRoute,
  deleteOverrideRoute,
  releaseRoute,
] as const);

export { routes as rateLimitRoutes };
