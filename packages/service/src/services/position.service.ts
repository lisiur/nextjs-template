import { HTTPException } from "hono/http-exception";
import { prisma } from "#lib/db";
import {
  assignPermissions,
  getPermissionsForRole,
} from "#services/role-permission.service";
import { listPermissionsForApp } from "#services/permission.service";
import { roleRepository } from "#repositories/role.repository";

const ORGANIZATION_APP_ID = "organization";

export async function listPositions(organizationId: string) {
  const positions = await prisma.position.findMany({
    where: { organizationId },
    include: {
      _count: { select: { memberPositions: true } },
      role: { select: { _count: { select: { rolePermissions: true } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return positions.map(({ role, ...p }) => ({
    ...p,
    membersCount: p._count.memberPositions,
    permissionsCount: role?._count.rolePermissions ?? 0,
  }));
}

export async function listPositionMembers(
  organizationId: string,
  positionId: string,
) {
  const position = await prisma.position.findFirst({
    where: { id: positionId, organizationId },
  });
  if (!position) {
    throw new HTTPException(404, { message: "Position not found" });
  }

  const memberPositions = await prisma.memberPosition.findMany({
    where: { positionId },
    include: {
      member: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          memberPositions: {
            include: {
              position: { select: { id: true, name: true, code: true } },
            },
          },
        },
      },
    },
  });

  return memberPositions.map((mp) => ({
    ...mp.member,
    positions: mp.member.memberPositions.map((mp2) => mp2.position),
  }));
}

export async function getPosition(organizationId: string, id: string) {
  const position = await prisma.position.findFirst({
    where: { id, organizationId },
  });
  if (!position) {
    throw new HTTPException(404, { message: "Position not found" });
  }
  return position;
}

export async function createPosition(
  organizationId: string,
  data: {
    name: string;
    code: string;
    description?: string;
    sortOrder?: number;
  },
) {
  const existing = await prisma.position.findUnique({
    where: { organizationId_code: { organizationId, code: data.code } },
  });
  if (existing) {
    throw new HTTPException(409, {
      message: "Code already taken in this organization",
    });
  }

  const position = await prisma.position.create({
    data: {
      organizationId,
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
    include: {
      _count: { select: { memberPositions: true } },
      role: { select: { _count: { select: { rolePermissions: true } } } },
    },
  });
  return {
    ...position,
    membersCount: position._count.memberPositions,
    permissionsCount: position.role?._count.rolePermissions ?? 0,
  };
}

export async function updatePosition(
  organizationId: string,
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string | null;
    sortOrder?: number;
  },
) {
  const position = await prisma.position.findFirst({
    where: { id, organizationId },
  });
  if (!position) {
    throw new HTTPException(404, { message: "Position not found" });
  }

  if (data.code && data.code !== position.code) {
    const existing = await prisma.position.findUnique({
      where: { organizationId_code: { organizationId, code: data.code } },
    });
    if (existing) {
      throw new HTTPException(409, {
        message: "Code already taken in this organization",
      });
    }
  }

  const updated = await prisma.position.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: {
      _count: { select: { memberPositions: true } },
      role: { select: { _count: { select: { rolePermissions: true } } } },
    },
  });

  if (position.roleId && (data.name || data.code)) {
    await roleRepository.update(position.roleId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: `position-${data.code}` }),
    });
  }

  return {
    ...updated,
    membersCount: updated._count.memberPositions,
    permissionsCount: updated.role?._count.rolePermissions ?? 0,
  };
}

export async function deletePosition(organizationId: string, id: string) {
  const position = await prisma.position.findFirst({
    where: { id, organizationId },
  });
  if (!position) {
    throw new HTTPException(404, { message: "Position not found" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.position.delete({ where: { id } });
    if (position.roleId) {
      await tx.role.delete({ where: { id: position.roleId } });
    }
  });

  return position;
}

export async function setMemberPositions(
  organizationId: string,
  memberId: string,
  positionIds: string[],
) {
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!member) {
    throw new HTTPException(404, { message: "Member not found" });
  }

  if (positionIds.length > 0) {
    const positions = await prisma.position.findMany({
      where: { id: { in: positionIds }, organizationId },
    });
    if (positions.length !== positionIds.length) {
      throw new HTTPException(400, {
        message: "One or more positions not found",
      });
    }
  }

  const currentMemberPositions = await prisma.memberPosition.findMany({
    where: { memberId },
    include: { position: { select: { roleId: true } } },
  });
  const oldRoleIds = currentMemberPositions
    .map((mp) => mp.position.roleId)
    .filter((r): r is string => r !== null);

  const newPositions =
    positionIds.length > 0
      ? await prisma.position.findMany({
          where: { id: { in: positionIds } },
          select: { id: true, roleId: true },
        })
      : [];
  const newRoleIds = newPositions
    .map((p) => p.roleId)
    .filter((r): r is string => r !== null);

  return prisma.$transaction(async (tx) => {
    await tx.memberPosition.deleteMany({ where: { memberId } });
    if (positionIds.length > 0) {
      await tx.memberPosition.createMany({
        data: positionIds.map((positionId) => ({ memberId, positionId })),
      });
    }

    const removedRoleIds = oldRoleIds.filter(
      (rid) => !newRoleIds.includes(rid),
    );
    const addedRoleIds = newRoleIds.filter(
      (rid) => !oldRoleIds.includes(rid),
    );

    for (const roleId of removedRoleIds) {
      await tx.roleAssignment.deleteMany({
        where: {
          userId: member.userId,
          roleId,
          scopeType: "ORGANIZATION",
          scopeId: organizationId,
        },
      });
    }
    for (const roleId of addedRoleIds) {
      await tx.roleAssignment.upsert({
        where: {
          userId_roleId_scopeType_scopeId: {
            userId: member.userId,
            roleId,
            scopeType: "ORGANIZATION",
            scopeId: organizationId,
          },
        },
        update: {},
        create: {
          userId: member.userId,
          roleId,
          scopeType: "ORGANIZATION",
          scopeId: organizationId,
        },
      });
    }

    return tx.memberPosition.findMany({
      where: { memberId },
      include: { position: true },
    });
  });
}

export async function getPositionPermissions(
  organizationId: string,
  positionId: string,
) {
  const position = await prisma.position.findFirst({
    where: { id: positionId, organizationId },
  });
  if (!position) {
    throw new HTTPException(404, { message: "Position not found" });
  }

  const assigned = position.roleId
    ? await getPermissionsForRole(position.roleId)
    : [];

  const { permissions: available } =
    await listPermissionsForApp(ORGANIZATION_APP_ID);

  return { assigned, available };
}

export async function setPositionPermissions(
  organizationId: string,
  positionId: string,
  permissionIds: string[],
) {
  const position = await prisma.position.findFirst({
    where: { id: positionId, organizationId },
  });
  if (!position) {
    throw new HTTPException(404, { message: "Position not found" });
  }

  let roleId = position.roleId;

  if (!roleId) {
    const role = await roleRepository.create({
      appId: ORGANIZATION_APP_ID,
      scopeType: "ORGANIZATION",
      scopeId: organizationId,
      name: position.name,
      code: `position-${position.code}`,
    });
    await prisma.position.update({
      where: { id: positionId },
      data: { roleId: role.id },
    });
    roleId = role.id;
  }

  await assignPermissions(roleId, permissionIds);

  const assigned = await getPermissionsForRole(roleId);
  const { permissions: available } =
    await listPermissionsForApp(ORGANIZATION_APP_ID);
  return { assigned, available };
}
