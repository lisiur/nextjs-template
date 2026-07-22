import type { Context } from "hono";

export function isSsrRequest(c: Context): boolean {
  const token = process.env.INTERNAL_API_TOKEN;
  return !!token && c.req.header("x-internal-token") === token;
}
