import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { logAudit } from "#lib/logger";
import { requireAdmin } from "#middleware/require-admin";
import { menuRoleRepository } from "#repositories/menu-role.repository";
import { roleRepository } from "#repositories/role.repository";
import {
  batchAssignBodySchema,
  errorSchema,
  roleMenusResponseSchema,
} from "./schema";

function collectDescendantIds(
  parentId: string,
  allMenus: { id: string; parentId: string | null }[],
): string[] {
  const ids = [parentId];
  const children = allMenus.filter((m) => m.parentId === parentId);
  for (const child of children) {
    ids.push(...collectDescendantIds(child.id, allMenus));
  }
  return ids;
}

function collectAncestorGroupIds(
  menuId: string,
  allMenus: { id: string; parentId: string | null; linkType: string }[],
): string[] {
  const ids: string[] = [];
  let current = allMenus.find((menu) => menu.id === menuId);

  while (current?.parentId) {
    const parent = allMenus.find((menu) => menu.id === current?.parentId);
    if (!parent) break;

    if (parent.linkType === "GROUP") {
      ids.push(parent.id);
    }

    current = parent;
  }

  return ids;
}

export const batchAssignMenus = defineOpenAPIRoute({
  route: createRoute({
    method: "put",
    path: "/batch",
    tags: ["MenuRole"],
    summary: "Batch assign menus to role",
    description:
      "Replaces all menu assignments for a role. Automatically includes descendant menus.",
    middleware: requireAdmin,
    request: {
      body: {
        content: { "application/json": { schema: batchAssignBodySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: roleMenusResponseSchema },
        },
        description: "Updated menu assignments for the role",
      },
      401: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Unauthorized",
      },
      400: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Bad Request",
      },
      404: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Role not found",
      },
    },
  }),
  handler: async (c) => {
    const { roleId, menuIds } = c.req.valid("json");
    const role = await roleRepository.findById(roleId);

    if (!role) {
      return c.json({ code: 404, message: "Role not found" }, 404);
    }

    const allMenus = await menuRoleRepository.findMenusByAppId(role.appId);
    const validMenuIds = new Set(allMenus.map((menu) => menu.id));

    const assignedMenuIds = new Set<string>();
    for (const menuId of menuIds) {
      if (!validMenuIds.has(menuId)) {
        return c.json(
          {
            code: 400,
            message: "Menu does not belong to the role application",
          },
          400,
        );
      }

      for (const id of collectAncestorGroupIds(menuId, allMenus)) {
        assignedMenuIds.add(id);
      }

      for (const id of collectDescendantIds(menuId, allMenus)) {
        assignedMenuIds.add(id);
      }
    }

    await menuRoleRepository.batchAssign(roleId, Array.from(assignedMenuIds));

    logAudit({
      event: "menu_role.assigned",
      category: "menu_role",
      targetId: roleId,
      metadata: { menuIds: Array.from(assignedMenuIds) },
      c,
    });

    const menus = await menuRoleRepository.getMenusForRole(roleId);
    return c.json({ menus }, 200);
  },
});
