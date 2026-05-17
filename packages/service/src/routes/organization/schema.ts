import { z } from "@hono/zod-openapi";

export const organizationSchema = z
  .object({
    id: z.string().openapi({ example: "clx1234567890" }),
    name: z.string().openapi({ example: "Acme Corp" }),
    slug: z.string().openapi({ example: "acme-corp" }),
    logo: z.string().nullable().optional(),
    metadata: z.string().nullable().optional(),
    createdAt: z.date(),
  })
  .openapi("Organization");

export const listOrganizationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const organizationIdParamSchema = z.object({
  id: z.string().min(1).openapi({ example: "clx1234567890" }),
});

export const createOrganizationBodySchema = z.object({
  name: z.string().min(1).openapi({ example: "Acme Corp" }),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .openapi({ example: "acme-corp" }),
  logo: z.string().url().optional(),
  metadata: z.string().optional(),
});

export const updateOrganizationBodySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  logo: z.string().url().nullable().optional(),
  metadata: z.string().nullable().optional(),
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

export const listOrganizationsResponseSchema = z
  .object({
    organizations: organizationSchema.array(),
    total: z.number(),
  })
  .openapi("ListOrganizationsResponse");

export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganizationBody = z.infer<
  typeof createOrganizationBodySchema
>;
export type UpdateOrganizationBody = z.infer<
  typeof updateOrganizationBodySchema
>;
