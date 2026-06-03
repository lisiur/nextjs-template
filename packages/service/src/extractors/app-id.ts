import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "#lib/db";

export async function tryAppId(c: Context): Promise<string | null> {
  const code = c.req.header("X-App-Code");
  if (!code) return null;
  const app = await prisma.application.findFirst({
    where: { code, deletedAt: null },
  });
  return app?.id ?? null;
}

export async function requireAppId(c: Context): Promise<string> {
  const code = c.req.header("X-App-Code");
  if (!code) {
    throw new HTTPException(400, { message: "Missing X-App-Code header" });
  }
  const appId = await tryAppId(c);
  if (!appId) {
    throw new HTTPException(404, {
      message: `Application not found: ${code}`,
    });
  }
  return appId;
}
