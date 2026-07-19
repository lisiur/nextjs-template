import { assertUserIsNotBuiltin } from "#lib/protected-user";
import type { ScopeContext } from "#lib/scope";
import { userRoleRepository } from "#repositories/user-role.repository";

export async function assignUserRole(
  userId: string,
  roleId: string,
  ctx: ScopeContext = {},
) {
  await assertUserIsNotBuiltin(userId);
  return userRoleRepository.assign(userId, roleId, ctx);
}

export async function removeUserRole(
  userId: string,
  roleId: string,
  ctx: ScopeContext = {},
) {
  await assertUserIsNotBuiltin(userId);
  await userRoleRepository.remove(userId, roleId, ctx);
}

export async function listUserRoles(userId: string, ctx: ScopeContext = {}) {
  return userRoleRepository.findByUser(userId, ctx);
}

export async function getUserAppMenus(userId: string) {
  return userRoleRepository.getMenusForUser(userId);
}
