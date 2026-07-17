import { HTTPException } from "hono/http-exception";
import type { Prisma } from "#generated/prisma/client";
import { prisma } from "#lib/db";

export async function getApplicationById(id: string) {
  const app = await prisma.application.findFirst({
    where: { id },
  });
  if (!app) {
    throw new HTTPException(404, { message: "Application not found" });
  }
  return app;
}

export async function updateApplication(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string | null;
    logo?: string | null;
    favicon?: string | null;
    copyright?: string | null;
    icp?: string | null;
    psif?: string | null;
    watermarkEnabled?: boolean;
    watermarkConfig?: string | null;
    sortOrder?: number;
  },
) {
  const existing = await prisma.application.findFirst({
    where: { id },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Application not found" });
  }

  if (data.code && data.code !== existing.code) {
    const codeTaken = await prisma.application.findFirst({
      where: { code: data.code },
    });
    if (codeTaken) {
      throw new HTTPException(409, {
        message: "Application code already exists",
      });
    }
  }

  return prisma.application.update({ where: { id }, data });
}

export async function listApplications(params: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, limit = 10, offset = 0 } = params;
  const where: Prisma.ApplicationWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total };
}
