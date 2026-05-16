import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { batchUpsertConfigs } from "./batchUpsertConfigs";
import { deleteConfig } from "./deleteConfig";
import { listAllConfigs } from "./listAllConfigs";
import { listConfigsByGroup } from "./listConfigsByGroup";
import { upsertConfig } from "./upsertConfig";

const systemConfigRoutes = new OpenAPIHono();

systemConfigRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

const routes = systemConfigRoutes.openapiRoutes([
  listAllConfigs,
  listConfigsByGroup,
  upsertConfig,
  batchUpsertConfigs,
  deleteConfig,
] as const);

export { routes as systemConfigRoutes };
