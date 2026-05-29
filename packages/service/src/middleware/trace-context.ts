import { createMiddleware } from "hono/factory";
import { runWithRequestContext } from "#lib/request-context";

export const traceContext = createMiddleware(async (c, next) => {
  const traceId =
    c.req.header("x-trace-id") ??
    c.req.header("x-request-id") ??
    crypto.randomUUID();

  c.set("traceId", traceId);
  await runWithRequestContext({ traceId }, next);
  c.header("x-trace-id", traceId);
});
