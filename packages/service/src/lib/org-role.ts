import { ORG_OWNER_ROLE_CODE, ORGANIZATION_APP_CODE } from "@repo/shared";
import { prisma } from "#lib/db";
import { ADMIN_SCOPE, ORG_SCOPE_PREFIX, orgScope } from "#lib/scope";

export type OrgRole = "owner" | "member";

const ownerRoleWhere = {
  code: ORG_OWNER_ROLE_CODE,
  appId: ORGANIZATION_APP_CODE,
} as const;

export const orgOwnerAssignmentWhere = (organizationId: string) => ({
  role: ownerRoleWhere,
  scope: orgScope(organizationId),
});

export async function getOrgOwnerRoleId(): Promise<string | null> {
  const role = await prisma.role.findUnique({
    where: {
      appId_scope_code: {
        appId: ORGANIZATION_APP_CODE,
        scope: ADMIN_SCOPE,
        code: ORG_OWNER_ROLE_CODE,
      },
    },
    select: { id: true },
  });
  return role?.id ?? null;
}

export function countOrgOwners(organizationId: string): Promise<number> {
  return prisma.roleAssignment.count({
    where: orgOwnerAssignmentWhere(organizationId),
  });
}

export async function isOrgOwner(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const count = await prisma.roleAssignment.count({
    where: { userId, ...orgOwnerAssignmentWhere(organizationId) },
  });
  return count > 0;
}

export async function getOrgOwnerUserIds(
  organizationId: string,
): Promise<Set<string>> {
  const rows = await prisma.roleAssignment.findMany({
    where: orgOwnerAssignmentWhere(organizationId),
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

export async function getUserOrgRole(
  userId: string,
  organizationId: string,
): Promise<OrgRole> {
  return (await isOrgOwner(userId, organizationId)) ? "owner" : "member";
}

export async function getOrgOwners(
  organizationIds: string[],
): Promise<Map<string, { id: string; name: string; email: string }>> {
  if (organizationIds.length === 0) return new Map();
  const ownerScopes = organizationIds.map(orgScope);
  const rows = await prisma.roleAssignment.findMany({
    where: {
      role: ownerRoleWhere,
      scope: { in: ownerScopes },
    },
    select: {
      scope: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const owners = new Map<string, { id: string; name: string; email: string }>();
  for (const row of rows) {
    const orgId = row.scope.startsWith(ORG_SCOPE_PREFIX)
      ? row.scope.slice(ORG_SCOPE_PREFIX.length)
      : row.scope;
    if (!owners.has(orgId)) {
      owners.set(orgId, row.user);
    }
  }
  return owners;
}
