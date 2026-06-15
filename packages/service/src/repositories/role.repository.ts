import { prisma } from "#lib/db";

type RoleScopeType = "PLATFORM" | "ORGANIZATION" | "APPLICATION";

const PLATFORM_SCOPE_ID = "";

function scopeIdOrDefault(scopeId?: string | null) {
  return scopeId ?? PLATFORM_SCOPE_ID;
}

export const roleRepository = {
  findByAppId(
    appId: string,
    scope?: { scopeType?: RoleScopeType; scopeId?: string | null },
  ) {
    const scopedWhere = scope?.scopeType
      ? {
          OR: [
            { scopeType: "PLATFORM" as const, scopeId: PLATFORM_SCOPE_ID },
            {
              scopeType: scope.scopeType,
              scopeId: scopeIdOrDefault(scope.scopeId),
            },
          ],
        }
      : { scopeType: "PLATFORM" as const, scopeId: PLATFORM_SCOPE_ID };

    return prisma.role.findMany({
      where: { appId, ...scopedWhere },
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.role.findUnique({ where: { id } });
  },

  findByAppAndCode(
    appId: string,
    code: string,
    scope?: { scopeType?: RoleScopeType; scopeId?: string | null },
  ) {
    const scopeType = scope?.scopeType ?? "PLATFORM";
    const scopeId = scopeIdOrDefault(scope?.scopeId);
    return prisma.role.findUnique({
      where: {
        appId_scopeType_scopeId_code: { appId, scopeType, scopeId, code },
      },
    });
  },

  create(data: {
    appId: string;
    scopeType?: RoleScopeType;
    scopeId?: string | null;
    name: string;
    code: string;
    flags?: string[];
  }) {
    return prisma.role.create({
      data: {
        ...data,
        scopeType: data.scopeType ?? "PLATFORM",
        scopeId: scopeIdOrDefault(data.scopeId),
      },
    });
  },

  update(
    id: string,
    data: {
      name?: string;
      code?: string;
      flags?: string[];
    },
  ) {
    return prisma.role.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.role.delete({ where: { id } });
  },
};
