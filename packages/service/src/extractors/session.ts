import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AuthType } from "#lib/session";
import { getSessionFromHeaders } from "#lib/session";

export async function trySession(c: Context): Promise<AuthType | null> {
  return getSessionFromHeaders(c.req.raw.headers);
}

export async function requireSession(c: Context): Promise<AuthType> {
  const session = await trySession(c);
  if (!session) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
  return session;
}
