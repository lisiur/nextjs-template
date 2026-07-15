import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ApiTokenPrincipal } from "#lib/api-token";
import { getApiTokenByBearer } from "#lib/api-token";
import type { AuthType } from "#lib/session";
import { getSessionFromHeaders } from "#lib/session";

export type Principal =
  | ({ kind: "user" } & AuthType)
  | ({ kind: "token" } & ApiTokenPrincipal);

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

function getBearerToken(headers: Headers): string | null {
  const header = headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

export async function tryBearerToken(
  c: Context,
): Promise<ApiTokenPrincipal | null> {
  const raw = getBearerToken(c.req.raw.headers);
  return getApiTokenByBearer(raw);
}

export async function requireBearerToken(
  c: Context,
): Promise<ApiTokenPrincipal> {
  const principal = await tryBearerToken(c);
  if (!principal) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return principal;
}

export async function tryPrincipal(c: Context): Promise<Principal | null> {
  const session = await trySession(c);
  if (session) return { kind: "user", ...session };

  const token = await tryBearerToken(c);
  if (token) return { kind: "token", ...token };

  return null;
}

export async function requirePrincipal(c: Context): Promise<Principal> {
  const principal = await tryPrincipal(c);
  if (!principal) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return principal;
}

export function getPrincipalUserId(principal: Principal): string {
  if (principal.kind === "user") {
    return principal.user.id;
  }
  return principal.ownerId;
}
