import { OpenAPIHono } from "@hono/zod-openapi";
import { changePassword } from "./changePassword";
import { getRegistrationStatus } from "./getRegistrationStatus";
import { getSession } from "./getSession";
import { signInEmail } from "./signInEmail";
import { signInWechat } from "./signInWechat";
import { signOut } from "./signOut";
import { signUpEmail } from "./signUpEmail";
import { updateUser } from "./updateUser";

const authRoutes = new OpenAPIHono();

const routes = authRoutes.openapiRoutes([
  signInEmail,
  signInWechat,
  signUpEmail,
  signOut,
  getSession,
  getRegistrationStatus,
  updateUser,
  changePassword,
] as const);

export { routes as authRoutes };
