import { prisma } from "../lib/db";

export const userRoleRepository = {
  findByUser(userId: string) {
    return prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  },

  findByUserAndRole(userId: string, roleId: string) {
    return prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
  },

  assign(userId: string, roleId: string) {
    return prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  },

  remove(userId: string, roleId: string) {
    return prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  },

  getMenusForUser(userId: string) {
    return prisma.menu.findMany({
      where: {
        menuRoles: {
          some: {
            role: {
              userRoles: { some: { userId } },
            },
          },
        },
        isVisible: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  },
};
