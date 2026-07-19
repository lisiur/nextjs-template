import type { Prisma } from "#generated/prisma/client";
import { prisma } from "#lib/db";

export type PermissionSortField = "name" | "description";

export function createPermission(data: {
  appId: string;
  name: string;
  code: string;
  group: string;
  description?: string;
}) {
  return prisma.permission.create({ data });
}

export function findPermissionByCode(code: string, appId: string) {
  return prisma.permission.findFirst({
    where: { appId, code },
  });
}

export function findPermissionsByGroup(group: string, appId: string) {
  return prisma.permission.findMany({
    where: { appId, group },
  });
}

export function findPermissionsByApp(appId: string) {
  return prisma.permission.findMany({
    where: { appId },
  });
}

export interface ListPermissionsParams {
  search?: string;
  sort?: PermissionSortField;
  sortDir?: "asc" | "desc";
  limit: number;
  offset: number;
}

export async function listPermissionsForApp(
  appId: string,
  params: ListPermissionsParams,
) {
  const { search, sort, sortDir, limit, offset } = params;

  const where: Prisma.PermissionWhereInput = search
    ? {
        AND: [
          { appId },
          {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
              { group: { contains: search, mode: "insensitive" } },
            ],
          },
        ],
      }
    : { appId };

  const orderBy: Prisma.PermissionOrderByWithRelationInput[] = sort
    ? [{ [sort]: sortDir === "desc" ? "desc" : "asc" }]
    : [{ group: "asc" }, { code: "asc" }];

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.permission.count({ where }),
  ]);

  return { permissions, total };
}

export async function deletePermissionByCode(code: string, appId: string) {
  const permission = await findPermissionByCode(code, appId);
  if (!permission) return null;
  return prisma.permission.delete({ where: { id: permission.id } });
}
