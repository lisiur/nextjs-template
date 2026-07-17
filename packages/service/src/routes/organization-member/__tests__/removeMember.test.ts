import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#lib/db", () => ({
  prisma: {
    member: { findFirst: vi.fn(), delete: vi.fn() },
    roleAssignment: { count: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "#lib/db";
import { removeMember } from "#services/member.service";

const db = prisma as unknown as {
  member: {
    findFirst: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  roleAssignment: {
    count: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe("removeMember", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.member.delete.mockResolvedValue({ id: "member1" });
    db.roleAssignment.deleteMany.mockResolvedValue({ count: 0 });
    db.$transaction.mockResolvedValue([]);
  });

  it("revokes org-scoped role assignments and deletes the member atomically", async () => {
    db.member.findFirst.mockResolvedValue({ id: "member1", userId: "user1" });
    // isOrgOwner -> roleAssignment.count returns 0 (not an owner)
    db.roleAssignment.count.mockResolvedValue(0);

    await removeMember("org1", "member1");

    // Org-scoped role assignments for (ORGANIZATION, org1) must be revoked
    expect(db.roleAssignment.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        scopeType: "ORGANIZATION",
        scopeId: "org1",
      },
    });
    // Member must be deleted
    expect(db.member.delete).toHaveBeenCalledWith({
      where: { id: "member1" },
    });
    // Both must run inside a single transaction
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.$transaction.mock.calls[0][0]).toHaveLength(2);
  });

  it("removes a non-last owner successfully", async () => {
    db.member.findFirst.mockResolvedValue({ id: "member1", userId: "user1" });
    // isOrgOwner -> count > 0 (is owner)
    // countOrgOwners -> 2 owners
    db.roleAssignment.count.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await removeMember("org1", "member1");

    expect(db.roleAssignment.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        scopeType: "ORGANIZATION",
        scopeId: "org1",
      },
    });
    expect(db.member.delete).toHaveBeenCalledWith({
      where: { id: "member1" },
    });
  });

  it("throws when removing the last owner", async () => {
    db.member.findFirst.mockResolvedValue({ id: "member1", userId: "user1" });
    // isOrgOwner -> count > 0 (is owner)
    // countOrgOwners -> 1 owner (the last one)
    db.roleAssignment.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    await expect(removeMember("org1", "member1")).rejects.toThrow(
      "Cannot remove the last owner",
    );

    expect(db.roleAssignment.deleteMany).not.toHaveBeenCalled();
    expect(db.member.delete).not.toHaveBeenCalled();
  });

  it("throws when the member is not found", async () => {
    db.member.findFirst.mockResolvedValue(null);

    await expect(removeMember("org1", "missing")).rejects.toThrow(
      "Member not found",
    );

    expect(db.roleAssignment.deleteMany).not.toHaveBeenCalled();
    expect(db.member.delete).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
