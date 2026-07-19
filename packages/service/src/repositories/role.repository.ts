import { prisma } from "#lib/db";
import { ADMIN_SCOPE, type ScopeContext, scopeFromContext } from "#lib/scope";

export const roleRepository = {
  findByAppId(appId: string, ctx: ScopeContext = {}) {
    const scope = scopeFromContext(ctx);
    // Include globally-defined roles (admin scope) plus the requested scope (if org-scoped)
    const scopeWhere =
      scope === ADMIN_SCOPE
        ? { scope: ADMIN_SCOPE }
        : { OR: [{ scope: ADMIN_SCOPE }, { scope }] };

    return prisma.role.findMany({
      where: { appId, ...scopeWhere },
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.role.findUnique({ where: { id } });
  },

  findByAppAndCode(appId: string, code: string, scope: string) {
    return prisma.role.findUnique({
      where: {
        appId_scope_code: { appId, scope, code },
      },
    });
  },

  create(data: {
    appId: string;
    scope: string;
    name: string;
    code: string;
    flags?: string[];
  }) {
    return prisma.role.create({ data });
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
