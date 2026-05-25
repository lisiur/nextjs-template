import type { Context } from "hono";
import { auth } from "#lib/auth";
import { prisma } from "#lib/db";

interface LogOperationParams {
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  targetId?: string;
  targetName?: string;
  detail?: string;
  c?: Context;
}

export async function logOperation(params: LogOperationParams) {
  try {
    let userId = params.userId;
    let userName = params.userName;

    if (!userId && params.c) {
      const session = await auth.api.getSession({
        headers: params.c.req.raw.headers,
      });
      userId = session?.user?.id;
      userName = session?.user?.name;
    }

    await prisma.operationLog.create({
      data: {
        userId: userId ?? null,
        userName: userName ?? null,
        action: params.action,
        module: params.module,
        targetId: params.targetId ?? null,
        targetName: params.targetName ?? null,
        detail: params.detail ?? null,
        ip: params.c ? getClientIp(params.c) : null,
        userAgent: params.c
          ? (params.c.req.header("user-agent") ?? null)
          : null,
      },
    });
  } catch (e) {
    console.error("[logOperation] Failed to write operation log:", e);
  }
}

function getClientIp(c: Context): string | null {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}
