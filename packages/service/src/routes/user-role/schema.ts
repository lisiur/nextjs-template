import { z } from "@hono/zod-openapi";
import { menuSchema } from "#routes/menu/schema";

export const roleAssignmentSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    roleId: z.string(),
    role: z.object({
      id: z.string(),
      appId: z.string(),
      scope: z.string(),
      name: z.string(),
      code: z.string(),
    }),
    scope: z.string(),
    createdAt: z.date(),
  })
  .openapi("RoleAssignment");

export const assignRoleAssignmentBodySchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  organizationId: z.string().optional(),
});

export const removeRoleAssignmentParamSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  organizationId: z.string().optional(),
});

export const listRoleAssignmentsQuerySchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().optional(),
});

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");

export const successResponseSchema = z.object({
  success: z.boolean(),
});

export const mineMenusResponseSchema = z
  .object({
    menus: menuSchema.array(),
  })
  .openapi("MineMenusResponse");
