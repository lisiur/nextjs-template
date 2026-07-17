import { HTTPException } from "hono/http-exception";
import type { Prisma } from "#generated/prisma/client";
import { prisma } from "#lib/db";
import {
  countOrgOwners,
  getOrgOwnerUserIds,
  getUserOrgRole,
  isOrgOwner,
  type OrgRole,
} from "#lib/org-role";
import { RoleScopeType } from "#lib/role-scope";

const memberInclude = {
  user: { select: { id: true, name: true, email: true, image: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.MemberInclude;

export async function listMembers(
  organizationId: string,
  params: {
    limit: number;
    offset: number;
    departmentId?: string | null;
  },
) {
  const { limit, offset, departmentId } = params;

  const where = {
    organizationId,
    ...(departmentId !== undefined && { departmentId }),
  };

  const [rows, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        department: { select: { id: true, name: true } },
        memberPositions: {
          include: {
            position: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.member.count({ where }),
  ]);
  const ownerUserIds = await getOrgOwnerUserIds(organizationId);
  const members = rows.map(({ memberPositions, ...member }) => ({
    ...member,
    role: ownerUserIds.has(member.userId) ? "owner" : "member",
    positions: memberPositions.map((mp) => mp.position),
  }));
  return { members, total };
}

export async function removeMember(organizationId: string, memberId: string) {
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!member) {
    throw new Error("Member not found");
  }

  // Check if this is the last owner
  if (await isOrgOwner(member.userId, organizationId)) {
    const ownerCount = await countOrgOwners(organizationId);
    if (ownerCount <= 1) {
      throw new Error("Cannot remove the last owner");
    }
  }

  return prisma.$transaction([
    prisma.roleAssignment.deleteMany({
      where: {
        userId: member.userId,
        scopeType: RoleScopeType.ORGANIZATION,
        scopeId: organizationId,
      },
    }),
    prisma.member.delete({ where: { id: memberId } }),
  ]);
}

export async function updateMember(
  organizationId: string,
  memberId: string,
  data: {
    name?: string;
    employeeId?: string | null;
    departmentId?: string | null;
  },
): Promise<
  Prisma.MemberGetPayload<{ include: typeof memberInclude }> & { role: OrgRole }
> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!member) {
    throw new HTTPException(404, { message: "Member not found" });
  }

  if (data.departmentId !== undefined && data.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, organizationId },
    });
    if (!department) {
      throw new HTTPException(400, { message: "Department not found" });
    }
  }

  if (data.name !== undefined) {
    await prisma.user.update({
      where: { id: member.userId },
      data: { name: data.name },
    });
  }

  const updateData: Record<string, unknown> = {};
  if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
  if (data.departmentId !== undefined)
    updateData.departmentId = data.departmentId;

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: updateData,
    include: memberInclude,
  });

  const role = await getUserOrgRole(updated.userId, organizationId);
  return { ...updated, role };
}

export async function batchUpdateMembers(
  organizationId: string,
  memberIds: string[],
  data: { departmentId: string | null },
) {
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds }, organizationId },
  });
  if (members.length !== memberIds.length) {
    throw new HTTPException(400, { message: "One or more members not found" });
  }

  if (data.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, organizationId },
    });
    if (!department) {
      throw new HTTPException(400, { message: "Department not found" });
    }
  }

  return prisma.member.updateMany({
    where: { id: { in: memberIds } },
    data: { departmentId: data.departmentId },
  });
}
