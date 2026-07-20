import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#lib/db", () => ({
  prisma: {
    role: { findUnique: vi.fn() },
    roleAssignment: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "#lib/db";
import { userRoleRepository } from "./user-role.repository";

const db = prisma as unknown as {
  role: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  roleAssignment: {
    upsert: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe("userRoleRepository.assign", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Interactive $transaction: invoke the callback with `prisma` as `tx`
    db.$transaction.mockImplementation(
      async (cb: (tx: typeof prisma) => Promise<unknown>) => cb(prisma),
    );
    db.roleAssignment.upsert.mockResolvedValue({
      id: "ra1",
      userId: "user1",
      roleId: "role1",
      scope: "admin",
    });
  });

  it("assigns a platform role at platform scope (no organizationId)", async () => {
    db.role.findUnique.mockResolvedValue({ id: "role1", scope: "admin" });

    await userRoleRepository.assign("user1", "role1", {});

    expect(db.roleAssignment.upsert).toHaveBeenCalledWith({
      where: {
        userId_roleId_scope: {
          userId: "user1",
          roleId: "role1",
          scope: "admin",
        },
      },
      update: {},
      create: { userId: "user1", roleId: "role1", scope: "admin" },
      include: { role: true },
    });
  });

  it("assigns an org role at its matching org scope", async () => {
    db.role.findUnique.mockResolvedValue({
      id: "role1",
      scope: "org:org1",
    });

    await userRoleRepository.assign("user1", "role1", {
      organizationId: "org1",
    });

    expect(db.roleAssignment.upsert).toHaveBeenCalledWith({
      where: {
        userId_roleId_scope: {
          userId: "user1",
          roleId: "role1",
          scope: "org:org1",
        },
      },
      update: {},
      create: { userId: "user1", roleId: "role1", scope: "org:org1" },
      include: { role: true },
    });
  });

  it("rejects a platform role assigned at org scope", async () => {
    db.role.findUnique.mockResolvedValue({ id: "role1", scope: "admin" });

    await expect(
      userRoleRepository.assign("user1", "role1", {
        organizationId: "org1",
      }),
    ).rejects.toThrow(
      "Role cannot be assigned under a scope that does not match its own",
    );

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.roleAssignment.upsert).not.toHaveBeenCalled();
  });

  it("rejects an org role assigned under a different org scope", async () => {
    db.role.findUnique.mockResolvedValue({
      id: "role1",
      scope: "org:org1",
    });

    await expect(
      userRoleRepository.assign("user1", "role1", {
        organizationId: "org2",
      }),
    ).rejects.toThrow(
      "Role cannot be assigned under a scope that does not match its own",
    );

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.roleAssignment.upsert).not.toHaveBeenCalled();
  });

  it("throws 404 when the role does not exist", async () => {
    db.role.findUnique.mockResolvedValue(null);

    await expect(
      userRoleRepository.assign("user1", "missing", {}),
    ).rejects.toThrow("Role not found");

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.roleAssignment.upsert).not.toHaveBeenCalled();
  });
});
