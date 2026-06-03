import { z } from "@hono/zod-openapi";

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");

export const unauthorizedResponse = {
  401: {
    content: {
      "application/json": { schema: errorSchema },
    },
    description: "Unauthorized",
  },
} as const;

export const forbiddenResponse = {
  403: {
    content: {
      "application/json": { schema: errorSchema },
    },
    description: "Forbidden",
  },
} as const;

export const deleteSuccessSchema = z
  .object({
    success: z.literal(true),
  })
  .openapi("DeleteSuccess");

export const successSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("Success");

export function idParamSchema(example = "clx1234567890") {
  return z.object({
    id: z.string().min(1).openapi({ example }),
  });
}
