import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#lib/db", () => ({
  prisma: {
    permission: {
      findMany: vi.fn(),
    },
    menu: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "#lib/db";
import {
  getMenusForUser,
  getUserPermissions,
  matchPermission,
} from "./role-permission.service";

const mockPrisma = prisma as unknown as {
  permission: {
    findMany: ReturnType<typeof vi.fn>;
  };
  menu: {
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
              roleAssignments: {
                some: {
                  OR: [{ scopeId: "", scopeType: "PLATFORM" }],
                  userId: "user1",
                },
              },
            },
          },
        },
      },
      select: { code: true },
    });
  });
});

describe("getMenusForUser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns org-app menus whose required permissions the user holds", async () => {
    const menus = [
      {
        id: "organization-members",
        appId: "organization",
        code: "members",
        sortOrder: 0,
        menuPermissions: [
          {
            permission: {
              id: "p1",
              code: "organization-member::list",
              name: "List Members",
              group: "organization-member",
            },
          },
        ],
      },
      {
        id: "organization-settings",
        appId: "organization",
        code: "settings",
        sortOrder: 1,
        menuPermissions: [
          {
            permission: {
              id: "p2",
              code: "organization-settings::view",
              name: "View Settings",
              group: "organization-settings",
            },
          },
        ],
      },
    ];
    mockPrisma.menu.findMany.mockResolvedValue(menus);

    await expect(
      getMenusForUser("user1", "organization", {
        appId: "organization",
        organizationId: "org1",
      }),
    ).resolves.toEqual([
      {
        id: "organization-members",
        appId: "organization",
        code: "members",
        sortOrder: 0,
        permissions: [
          {
            id: "p1",
            code: "organization-member::list",
            name: "List Members",
            group: "organization-member",
          },
        ],
      },
      {
        id: "organization-settings",
        appId: "organization",
        code: "settings",
        sortOrder: 1,
        permissions: [
          {
            id: "p2",
            code: "organization-settings::view",
            name: "View Settings",
            group: "organization-settings",
          },
        ],
      },
    ]);

    expect(mockPrisma.menu.findMany).toHaveBeenCalledWith({
      where: {
        appId: "organization",
        menuPermissions: {
          some: {
            permission: {
              rolePermissions: {
                some: {
                  role: {
                    roleAssignments: {
                      some: {
                        userId: "user1",
                        OR: [
                          { scopeType: "PLATFORM", scopeId: "" },
                          { scopeType: "ORGANIZATION", scopeId: "org1" },
                          { scopeType: "APPLICATION", scopeId: "organization" },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
      include: {
        menuPermissions: {
          include: {
            permission: {
              select: { id: true, code: true, name: true, group: true },
            },
          },
        },
      },
    });
  });
});

describe("matchPermission", () => {
  it("matches an exact positive permission", () => {
    expect(matchPermission(["department::create"], "department::create")).toBe(
      true,
    );
  });

  it("matches a wildcard scope group::*", () => {
    expect(matchPermission(["department::*"], "department::delete")).toBe(true);
  });

  it("matches the global wildcard *", () => {
    expect(matchPermission(["*"], "anything::goes")).toBe(true);
  });

  it("negation overrides an otherwise-matching positive rule", () => {
    expect(
      matchPermission(
        ["department::*", "!department::delete"],
        "department::delete",
      ),
    ).toBe(false);
  });

  it("returns false when no permission matches", () => {
    expect(matchPermission(["role::create"], "department::create")).toBe(false);
  });

  it("returns false for an empty permission set", () => {
    expect(matchPermission([], "department::create")).toBe(false);
  });
});
