import { HTTPException } from "hono/http-exception";
import { prisma } from "#lib/db";
import {
  ADMIN_SCOPE,
  parseScope,
  type ScopeContext,
  scopeFromContext,
} from "#lib/scope";
import {
  fillAncestorGroups,
  menuPermissionsInclude,
  serializeMenu,
} from "#services/menu.service";

export const userRoleRepository = {
  findByUser(userId: string, ctx: ScopeContext = {}) {
    const scope = scopeFromContext(ctx);
    return prisma.roleAssignment.findMany({
      where: { userId, scope },
      include: { role: true },
    });
  },

  findByUserAndRole(userId: string, roleId: string) {
    return prisma.roleAssignment.findUnique({
      where: {
        userId_roleId_scope: {
          userId,
          roleId,
          scope: ADMIN_SCOPE,
        },
      },
    });
  },

  async assign(userId: string, roleId: string, ctx: ScopeContext = {}) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new HTTPException(404, { message: "Role not found" });
    }

    const scope = scopeFromContext(ctx);
    const roleScope = parseScope(role.scope);
    if (roleScope.kind === "org" && role.scope !== scope) {
      throw new HTTPException(400, {
        message:
          "Organization-specific role can only be assigned in its organization",
      });
    }

    return prisma.$transaction(async (tx) => {
      return tx.roleAssignment.upsert({
        where: {
          userId_roleId_scope: {
            userId,
            roleId,
            scope,
          },
        },
        update: {},
        create: { userId, roleId, scope },
        include: { role: true },
      });
    });
  },

  remove(userId: string, roleId: string, ctx: ScopeContext = {}) {
    const scope = scopeFromContext(ctx);
    return prisma.roleAssignment.deleteMany({
      where: { userId, roleId, scope },
    });
  },

  async getMenusForUser(userId: string) {
    const menus = await prisma.menu.findMany({
      where: {
        OR: [
          {
            menuPermissions: {
              some: {
                permission: {
                  rolePermissions: {
                    some: {
                      role: {
                        roleAssignments: {
                          some: {
                            userId,
                            scope: ADMIN_SCOPE,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            AND: [
              { linkType: { not: "GROUP" } },
              { menuPermissions: { none: {} } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: "asc" },
      include: menuPermissionsInclude,
    });

    const withAncestors = await fillAncestorGroups(menus);
    return withAncestors.map(serializeMenu);
  },
};
