import { OpenAPIHono } from "@hono/zod-openapi";
import { getFile } from "./getFile";
import { signFile } from "./signFile";
import { uploadFile } from "./uploadFile";

const uploadRoutes = new OpenAPIHono();

const routes = uploadRoutes.openapiRoutes([
  uploadFile,
  getFile,
  signFile,
] as const);

export { routes as uploadRoutes };
