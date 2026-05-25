import { z } from "@hono/zod-openapi";

export const operationLogSchema = z
  .object({
    id: z.string().openapi({ example: "clx1234567890" }),
    userId: z.string().nullable().optional(),
    userName: z.string().nullable().optional(),
    action: z.string().openapi({ example: "create" }),
    module: z.string().openapi({ example: "organization" }),
    targetId: z.string().nullable().optional(),
    targetName: z.string().nullable().optional(),
    detail: z.string().nullable().optional(),
    ip: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    createdAt: z.date(),
  })
  .openapi("OperationLog");

export const listLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  action: z.string().optional(),
  module: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const logIdParamSchema = z.object({
  id: z.string().min(1).openapi({ example: "clx1234567890" }),
});

export const deleteLogsBodySchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .openapi({ example: ["clx1234567890"] }),
});

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");

export const deleteSuccessSchema = z
  .object({
    success: z.literal(true),
  })
  .openapi("DeleteSuccess");

export const listLogsResponseSchema = z
  .object({
    logs: operationLogSchema.array(),
    total: z.number(),
  })
  .openapi("ListLogsResponse");
