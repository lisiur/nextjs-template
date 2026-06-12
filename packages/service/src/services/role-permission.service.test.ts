import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#lib/db", () => ({
  prisma: {
    permission: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "#lib/db";
import { getUserPermissions } from "./role-permission.service";

const mockPrisma = prisma as unknown as {
  permission: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe("getUserPermissions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads only global API permissions", async () => {
    mockPrisma.permission.findMany.mockResolvedValue([
      { code: "organization::create" },
      { code: "upload::sign" },
    ]);

    await expect(getUserPermissions("user1")).resolves.toEqual([
      "organization::create",
      "upload::sign",
    ]);
    expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
      where: {
        appId: null,
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId: "user1" },
              },
            },
          },
        },
      },
      select: { code: true },
    });
  });
});
