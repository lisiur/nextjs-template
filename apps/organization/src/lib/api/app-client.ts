import type { app } from "@repo/service";
import { hc } from "hono/client";

type AppType = typeof app;

const APP_CODE = "organization";
const LOCAL_SHELL_ORIGIN = "http://localhost:3000";
const getBrowserApiOrigin = () => {
  if (
    window.location.hostname === "localhost" &&
    window.location.port === "3002"
  ) {
    return LOCAL_SHELL_ORIGIN;
  }
  return window.location.origin;
};

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (typeof window !== "undefined" ? getBrowserApiOrigin() : LOCAL_SHELL_ORIGIN);

export const appClient = hc<AppType>(API_ORIGIN, {
  headers: { "X-App-Code": APP_CODE },
});
