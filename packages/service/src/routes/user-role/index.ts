import { OpenAPIHono } from "@hono/zod-openapi";
import { assignRoleAssignment } from "./assignUserRole";
import { getUserAppRoles } from "./getUserAppRoles";
import { listRoleAssignments } from "./listUserRoles";
import { removeRoleAssignment } from "./removeUserRole";

const userRoleRoutes = new OpenAPIHono();

const routes = userRoleRoutes.openapiRoutes([
  assignRoleAssignment,
  removeRoleAssignment,
  listRoleAssignments,
  getUserAppRoles,
] as const);

export { routes as userRoleRoutes };
