import type { Application } from "#routes/application/schema";
import type { AuthType } from "#services/auth.service";

declare module "hono" {
  interface ContextVariableMap {
    appId: string;
    currentApp: Application;
    session: AuthType | null;
  }
}
