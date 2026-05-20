# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-05-20
**Files analyzed:** 15 (8 new, 3 modified, 4 i18n)
**Analogs found:** 15 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/service/prisma/schema.prisma` | model | CRUD | `packages/service/prisma/schema.prisma` (existing) | exact |
| `packages/service/src/routes/application/schema.ts` | schema | CRUD | `packages/service/src/routes/organization/schema.ts` | exact |
| `packages/service/src/routes/application/index.ts` | route | request-response | `packages/service/src/routes/organization/index.ts` | exact |
| `packages/service/src/routes/application/createApplication.ts` | route | CRUD | `packages/service/src/routes/organization/createOrganization.ts` | exact |
| `packages/service/src/routes/application/getApplication.ts` | route | CRUD | `packages/service/src/routes/organization/getOrganization.ts` | exact |
| `packages/service/src/routes/application/listApplications.ts` | route | CRUD | `packages/service/src/routes/organization/listOrganizations.ts` | role-match |
| `packages/service/src/routes/application/updateApplication.ts` | route | CRUD | `packages/service/src/routes/organization/updateOrganization.ts` | exact |
| `packages/service/src/routes/application/deleteApplication.ts` | route | CRUD | `packages/service/src/routes/organization/deleteOrganization.ts` | role-match |
| `packages/service/src/routes/index.ts` | route | request-response | `packages/service/src/routes/index.ts` (existing) | exact |
| `apps/admin/src/app/(logged)/applications/page.tsx` | component | request-response | `apps/admin/src/app/(logged)/organizations/page.tsx` | exact |
| `apps/admin/src/app/(logged)/applications/components/app-table.tsx` | component | request-response | `apps/admin/src/app/(logged)/organizations/components/organization-table.tsx` | role-match |
| `apps/admin/src/app/(logged)/applications/components/app-dialog.tsx` | component | CRUD | `apps/admin/src/app/(logged)/organizations/components/organization-dialog.tsx` | role-match |
| `apps/admin/src/app/(logged)/applications/components/delete-confirm-dialog.tsx` | component | CRUD | `apps/admin/src/app/(logged)/organizations/components/delete-confirm-dialog.tsx` | exact |
| `apps/admin/messages/en.json` | config | — | `apps/admin/messages/en.json` (existing) | exact |
| `apps/admin/messages/zh.json` | config | — | `apps/admin/messages/zh.json` (existing) | exact |

## Pattern Assignments

### `packages/service/prisma/schema.prisma` (model, CRUD)

**Analog:** `packages/service/prisma/schema.prisma` (existing file — append models)

**Schema conventions** (lines 10-30, User model pattern):
```prisma
model User {
  id            String       @id @default(cuid())
  name          String
  email         String
  ...
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  sessions      Session[]

  @@unique([email])
  @@map("user")
}
```

**Add new models after Upload (line 157):**
```prisma
model Application {
  id          String    @id @default(cuid())
  name        String
  code        String
  description String?
  logo        String?
  sortOrder   Int       @default(0)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  menus       Menu[]

  @@unique([code])
  @@index([deletedAt])
  @@map("application")
}

model Menu {
  id         String   @id @default(cuid())
  appId      String
  app        Application @relation(fields: [appId], references: [id], onDelete: Cascade)
  parentId   String?
  parent     Menu?    @relation("MenuTree", fields: [parentId], references: [id], onDelete: Cascade)
  children   Menu[]   @relation("MenuTree")
  name       String
  code       String
  icon       String?
  url        String?
  sortOrder  Int      @default(0)
  isExternal Boolean  @default(false)
  isVisible  Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  menuRoles  MenuRole[]

  @@index([appId])
  @@index([parentId])
  @@map("menu")
}

model MenuRole {
  id        String   @id @default(cuid())
  menuId    String
  menu      Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)
  roleId    String
  createdAt DateTime @default(now())

  @@unique([menuId, roleId])
  @@index([menuId])
  @@index([roleId])
  @@map("menu_role")
}
```

**Key conventions:**
- `@id @default(cuid())` for all IDs
- `@default(now())` for createdAt, `@updatedAt` for updatedAt
- `@@map("table_name")` for snake_case table names
- `@@unique([field])` for uniqueness constraints
- `@@index([field])` for foreign keys
- Self-referential relation uses named relation `"MenuTree"`

---

### `packages/service/src/routes/application/schema.ts` (schema, CRUD)

**Analog:** `packages/service/src/routes/organization/schema.ts` (lines 1-71)

**Imports pattern** (line 1):
```typescript
import { z } from "@hono/zod-openapi";
```

**Response schema pattern** (lines 3-12):
```typescript
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
```

**Query schema pattern** (lines 14-17):
```typescript
export const listOrganizationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});
```

**Create body schema pattern** (lines 23-32):
```typescript
export const createOrganizationBodySchema = z.object({
  name: z.string().min(1).openapi({ example: "Acme Corp" }),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).openapi({ example: "acme-corp" }),
  logo: z.string().url().optional(),
  metadata: z.string().optional(),
});
```

**Error schema pattern** (lines 45-50):
```typescript
export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");
```

**Type export pattern** (lines 65-71):
```typescript
export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganizationBody = z.infer<typeof createOrganizationBodySchema>;
export type UpdateOrganizationBody = z.infer<typeof updateOrganizationBodySchema>;
```

**Key differences for Application:**
- Add `search` to query schema: `search: z.string().optional()`
- Add `sortOrder` to body schemas
- Code is free-form string (no regex), uniqueness checked at API level
- Response schema wraps in `{ applications: ..., total: ... }`

---

### `packages/service/src/routes/application/index.ts` (route, request-response)

**Analog:** `packages/service/src/routes/organization/index.ts` (lines 1-28)

**Full pattern** — clone directly:
```typescript
import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { createOrganization } from "./createOrganization";
import { deleteOrganization } from "./deleteOrganization";
import { getOrganization } from "./getOrganization";
import { listOrganizations } from "./listOrganizations";
import { updateOrganization } from "./updateOrganization";

const organizationRoutes = new OpenAPIHono();

organizationRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

const routes = organizationRoutes.openapiRoutes([
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
] as const);

export { routes as organizationRoutes };
```

**Key:** Replace `organizationRoutes` → `applicationRoutes`, import application action files, export as `applicationRoutes`.

---

### `packages/service/src/routes/application/createApplication.ts` (route, CRUD)

**Analog:** `packages/service/src/routes/organization/createOrganization.ts` (lines 1-70)

**Imports pattern** (lines 1-8):
```typescript
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { prisma } from "../../lib/db";
import {
  createOrganizationBodySchema,
  errorSchema,
  organizationSchema,
} from "./schema";
```

**Route definition pattern** (lines 10-47):
```typescript
export const createOrganization = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/",
    tags: ["Organization"],
    summary: "Create an organization",
    description: "Create a new organization.",
    request: {
      body: {
        content: {
          "application/json": { schema: createOrganizationBodySchema },
        },
        required: true,
      },
    },
    responses: {
      201: { content: { "application/json": { schema: organizationSchema } }, description: "..." },
      401: { content: { "application/json": { schema: errorSchema } }, description: "Unauthorized" },
      409: { content: { "application/json": { schema: errorSchema } }, description: "Slug already taken" },
    },
  }),
```

**Handler pattern** (lines 48-69):
```typescript
  handler: async (c) => {
    const body = c.req.valid("json");
    const existing = await prisma.organization.findUnique({
      where: { slug: body.slug },
    });
    if (existing) {
      throw new HTTPException(409, { message: "Slug already taken" });
    }
    const org = await prisma.organization.create({
      data: { name: body.name, slug: body.slug, logo: body.logo, metadata: body.metadata, createdAt: new Date() },
    });
    return c.json(org, 201);
  },
```

**Key differences for Application:**
- Uniqueness check uses `findFirst` with `deletedAt: null` filter (not `findUnique`)
- No `createdAt: new Date()` in create data (schema defaults handle it)

---

### `packages/service/src/routes/application/getApplication.ts` (route, CRUD)

**Analog:** `packages/service/src/routes/organization/getOrganization.ts` (lines 1-51)

**Full pattern** — clone and modify:
```typescript
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { prisma } from "../../lib/db";
import { errorSchema, organizationIdParamSchema, organizationSchema } from "./schema";

export const getOrganization = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Organization"],
    summary: "Get an organization",
    description: "Returns a single organization by ID.",
    request: { params: organizationIdParamSchema },
    responses: {
      200: { content: { "application/json": { schema: organizationSchema } }, description: "The organization" },
      401: { content: { "application/json": { schema: errorSchema } }, description: "Unauthorized" },
      404: { content: { "application/json": { schema: errorSchema } }, description: "Not found" },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new HTTPException(404, { message: "Organization not found" });
    }
    return c.json(org, 200);
  },
});
```

**Key difference:** Use `findFirst({ where: { id, deletedAt: null } })` instead of `findUnique` for soft-delete awareness.

---

### `packages/service/src/routes/application/listApplications.ts` (route, CRUD)

**Analog:** `packages/service/src/routes/organization/listOrganizations.ts` (lines 1-50)

**Base pattern** (lines 9-49):
```typescript
export const listOrganizations = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Organization"],
    summary: "List all organizations",
    description: "Returns a paginated list of all organizations.",
    request: { query: listOrganizationsQuerySchema },
    responses: {
      200: { content: { "application/json": { schema: listOrganizationsResponseSchema } }, description: "..." },
      401: { content: { "application/json": { schema: errorSchema } }, description: "Unauthorized" },
    },
  }),
  handler: async (c) => {
    const { limit, offset } = c.req.valid("query");
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({ orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      prisma.organization.count(),
    ]);
    return c.json({ organizations, total }, 200);
  },
});
```

**Key additions for Application:**
1. Extract `search` from query params
2. Build dynamic `where` clause with `deletedAt: null` + optional `OR` search filter
3. Add `search` to query schema
4. Use `mode: "insensitive"` for case-insensitive search on name/code/description

---

### `packages/service/src/routes/application/updateApplication.ts` (route, CRUD)

**Analog:** `packages/service/src/routes/organization/updateOrganization.ts` (lines 1-81)

**Handler pattern** (lines 56-80):
```typescript
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Organization not found" });
    }
    if (body.slug && body.slug !== existing.slug) {
      const slugTaken = await prisma.organization.findUnique({ where: { slug: body.slug } });
      if (slugTaken) {
        throw new HTTPException(409, { message: "Slug already taken" });
      }
    }
    const org = await prisma.organization.update({ where: { id }, data: body });
    return c.json(org, 200);
  },
```

**Key differences for Application:**
- Uniqueness check on `code` instead of `slug`
- Use `findFirst({ where: { id, deletedAt: null } })` for existence check
- Code uniqueness check also filters `deletedAt: null`

---

### `packages/service/src/routes/application/deleteApplication.ts` (route, CRUD)

**Analog:** `packages/service/src/routes/organization/deleteOrganization.ts` (lines 1-54)

**Handler pattern** (lines 42-53):
```typescript
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Organization not found" });
    }
    await prisma.organization.delete({ where: { id } });
    return c.json({ success: true as const }, 200);
  },
```

**Key difference:** Soft delete instead of hard delete:
```typescript
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const existing = await prisma.application.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new HTTPException(404, { message: "Application not found" });
    }
    await prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return c.json({ success: true as const }, 200);
  },
```

---

### `packages/service/src/routes/index.ts` (route, request-response)

**Analog:** `packages/service/src/routes/index.ts` (existing — modify)

**Current pattern** (lines 1-13):
```typescript
import { OpenAPIHono } from "@hono/zod-openapi";
import { authRoutes } from "./auth.routes";
import { organizationRoutes } from "./organization";
import { systemConfigRoutes } from "./system-config";
import { uploadRoutes } from "./upload";

const routes = new OpenAPIHono()
  .route("/auth", authRoutes)
  .route("/system-config", systemConfigRoutes)
  .route("/organizations", organizationRoutes)
  .route("/upload", uploadRoutes);

export { routes };
```

**Add line:**
```typescript
import { applicationRoutes } from "./application";
```
**Add chain:**
```typescript
.route("/applications", applicationRoutes)
```

---

### `apps/admin/src/app/(logged)/applications/page.tsx` (component, request-response)

**Analog:** `apps/admin/src/app/(logged)/organizations/page.tsx` (lines 1-18)

**Full pattern** — clone directly, rename:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { OrganizationTable } from "./components/organization-table";

export default function OrganizationsPage() {
  const t = useTranslations("Organizations");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <OrganizationTable />
    </div>
  );
}
```

**Changes:** Replace `Organizations` → `Applications`, `OrganizationTable` → `AppTable`.

---

### `apps/admin/src/app/(logged)/applications/components/app-table.tsx` (component, request-response)

**Analog:** `apps/admin/src/app/(logged)/organizations/components/organization-table.tsx` (lines 1-231)

**Imports pattern** (lines 1-20):
```tsx
"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { appClient } from "@/lib/api";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { OrganizationDialog } from "./organization-dialog";
```

**State pattern** (lines 31-43):
```tsx
export function OrganizationTable() {
  const t = useTranslations("Organizations");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);

  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const totalPages = Math.ceil(total / pageSize);
```

**Fetch pattern** (lines 45-61):
```tsx
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appClient.api.organizations.$get({
        query: { limit: pageSize, offset },
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations);
        setTotal(data.total);
      }
    } catch {
      toast.error(t("fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [offset, t]);
```

**Key additions for App table:**
1. Add `search` state + debounced search input (use `useRef` + `setTimeout` for debounce)
2. Include `search: debouncedSearch || undefined` in fetch query params
3. Reset page to 1 when search changes
4. Add search input UI above the table
5. App interface includes `code`, `description`, `logo`, `sortOrder` (not `slug`)

---

### `apps/admin/src/app/(logged)/applications/components/app-dialog.tsx` (component, CRUD)

**Analog:** `apps/admin/src/app/(logged)/organizations/components/organization-dialog.tsx` (lines 1-243)

**Form schema pattern** (lines 24-32):
```tsx
const orgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  logo: z.string().optional().or(z.literal("")),
  metadata: z.string().optional(),
});
```

**useForm pattern** (lines 69-84):
```tsx
  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
    watch, setValue, reset,
  } = useForm<OrgInput>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
      logo: organization?.logo ?? "",
      metadata: organization?.metadata ?? "",
    },
  });
```

**Logo upload pattern** (lines 88-98):
```tsx
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
      setValue("logo", dataUrl, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  }
```

**Submit pattern** (lines 114-141):
```tsx
  async function onSubmit(data: OrgInput) {
    try {
      if (isEdit) {
        await appClient.api.organizations[":id"].$put({
          param: { id: organization.id },
          json: { name: data.name, slug: data.slug, logo: data.logo || null, metadata: data.metadata || null },
        });
      } else {
        await appClient.api.organizations.$post({
          json: { name: data.name, slug: data.slug, logo: data.logo || undefined, metadata: data.metadata || undefined },
        });
      }
      reset();
      onSuccess();
    } catch {
      // Error handled by client
    }
  }
```

**Key differences for App dialog:**
- Schema: `code` (free-form string, no regex) instead of `slug`
- API paths: `appClient.api.applications[":id"].$put()` / `appClient.api.applications.$post()`
- Fields: `name`, `code`, `description`, `logo` (no `slug`, no `metadata`)
- Add file size validation (~2MB max) for logo upload
- Use `unoptimized` prop on `<Image>` for base64 preview

---

### `apps/admin/src/app/(logged)/applications/components/delete-confirm-dialog.tsx` (component, CRUD)

**Analog:** `apps/admin/src/app/(logged)/organizations/components/delete-confirm-dialog.tsx` (lines 1-78)

**Full pattern** — clone directly, rename:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { appClient } from "@/lib/api";

interface DeleteConfirmDialogProps {
  organization: { id: string; name: string; };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteConfirmDialog({ organization, open, onOpenChange, onSuccess }: DeleteConfirmDialogProps) {
  const t = useTranslations("Organizations");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await appClient.api.organizations[":id"].$delete({
        param: { id: organization.id },
      });
      onSuccess();
    } catch {
      // Error handled by client
    } finally {
      setLoading(false);
    }
  }
  // ... Dialog JSX
}
```

**Changes:** Replace `organization` prop → `app`, API path → `appClient.api.applications[":id"].$delete()`.

---

### `apps/admin/messages/en.json` (config)

**Analog:** `apps/admin/messages/en.json` (existing — add Applications section)

**Pattern from Organizations section** (lines 150-180):
```json
"Organizations": {
  "title": "Organization Management",
  "description": "Manage system organizations",
  "name": "Name",
  "slug": "Slug",
  "logo": "Logo",
  "uploadLogo": "Upload Logo",
  "metadata": "Metadata",
  "createdAt": "Created At",
  "actions": "Actions",
  "noOrgs": "No organizations found",
  "addOrg": "Add Organization",
  ...
}
```

**Add new section:**
```json
"Applications": {
  "title": "Application Management",
  "description": "Manage system applications",
  "name": "Name",
  "code": "Code",
  "description_label": "Description",
  "logo": "Logo",
  "uploadLogo": "Upload Logo",
  "sortOrder": "Sort Order",
  "createdAt": "Created At",
  "actions": "Actions",
  "search": "Search applications...",
  "noApps": "No applications found",
  "addApp": "Add Application",
  "addAppDescription": "Create a new application",
  "editApp": "Edit Application",
  "editAppDescription": "Update application information",
  "deleteApp": "Delete Application",
  "confirmDelete": "Are you sure you want to delete",
  "cancel": "Cancel",
  "save": "Save",
  "saving": "Saving...",
  "delete": "Delete",
  "deleting": "Deleting...",
  "updateSuccess": "Application updated successfully",
  "createSuccess": "Application created successfully",
  "deleteSuccess": "Application deleted successfully",
  "fetchFailed": "Failed to fetch applications",
  "showing": "Showing",
  "of": "of",
  "previous": "Previous",
  "next": "Next"
}
```

**Also add to Sidebar section:**
```json
"applications": "Applications"
```

---

### `apps/admin/messages/zh.json` (config)

**Analog:** `apps/admin/messages/zh.json` (existing — add Applications section)

**Add new section:**
```json
"Applications": {
  "title": "应用管理",
  "description": "管理系统应用",
  "name": "名称",
  "code": "编码",
  "description_label": "描述",
  "logo": "Logo",
  "uploadLogo": "上传 Logo",
  "sortOrder": "排序",
  "createdAt": "创建时间",
  "actions": "操作",
  "search": "搜索应用...",
  "noApps": "暂无应用",
  "addApp": "新增应用",
  "addAppDescription": "创建新的应用",
  "editApp": "编辑应用",
  "editAppDescription": "更新应用信息",
  "deleteApp": "删除应用",
  "confirmDelete": "确定要删除",
  "cancel": "取消",
  "save": "保存",
  "saving": "保存中...",
  "delete": "删除",
  "deleting": "删除中...",
  "updateSuccess": "应用更新成功",
  "createSuccess": "应用创建成功",
  "deleteSuccess": "应用删除成功",
  "fetchFailed": "获取应用列表失败",
  "showing": "显示",
  "of": "/",
  "previous": "上一页",
  "next": "下一页"
}
```

**Also add to Sidebar section:**
```json
"applications": "应用"
```

---

## Shared Patterns

### Authentication Middleware
**Source:** `packages/service/src/routes/organization/index.ts` lines 12-18
**Apply to:** `packages/service/src/routes/application/index.ts`
```typescript
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});
```

### Error Handling (HTTPException)
**Source:** `packages/service/src/routes/organization/createOrganization.ts` lines 48-56
**Apply to:** All application route handlers
```typescript
import { HTTPException } from "hono/http-exception";
// Usage:
throw new HTTPException(404, { message: "Application not found" });
throw new HTTPException(409, { message: "Application code already exists" });
```

### Prisma Import
**Source:** `packages/service/src/routes/organization/createOrganization.ts` line 3
**Apply to:** All application route handlers
```typescript
import { prisma } from "../../lib/db";
```

### Frontend API Client
**Source:** `apps/admin/src/app/(logged)/organizations/components/organization-table.tsx` line 18
**Apply to:** All application frontend components
```typescript
import { appClient } from "@/lib/api";
// GET: appClient.api.applications.$get({ query: { limit, offset, search } })
// POST: appClient.api.applications.$post({ json: { ... } })
// PUT: appClient.api.applications[":id"].$put({ param: { id }, json: { ... } })
// DELETE: appClient.api.applications[":id"].$delete({ param: { id } })
```

### Toast Notifications
**Source:** `apps/admin/src/app/(logged)/organizations/components/organization-table.tsx` lines 57, 70-83
**Apply to:** All application frontend components
```typescript
import { toast } from "sonner";
toast.success(t("createSuccess"));
toast.error(t("fetchFailed"));
```

### Loading State (Spinner)
**Source:** `apps/admin/src/app/(logged)/organizations/components/organization-table.tsx` lines 85-91
**Apply to:** `app-table.tsx`
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center py-8">
      <Spinner />
    </div>
  );
}
```

### Logo Upload (FileReader → base64)
**Source:** `apps/admin/src/app/(logged)/organizations/components/organization-dialog.tsx` lines 88-98
**Apply to:** `app-dialog.tsx`
```typescript
function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    setLogoPreview(dataUrl);
    setValue("logo", dataUrl, { shouldValidate: true });
  };
  reader.readAsDataURL(file);
}
```

### Form Validation (react-hook-form + zod)
**Source:** `apps/admin/src/app/(logged)/organizations/components/organization-dialog.tsx` lines 24-34, 69-84
**Apply to:** `app-dialog.tsx`
```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const appSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
});
```

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `packages/service/src/routes/application/listApplications.ts` | route | CRUD | Enhanced with search — Organization list has no search capability. Use RESEARCH.md search pattern (lines 375-442). |
| `packages/service/src/routes/application/deleteApplication.ts` | route | CRUD | Soft delete — Organization uses hard delete. Use RESEARCH.md soft delete pattern (lines 445-466). |
| `apps/admin/src/app/(logged)/applications/components/app-table.tsx` | component | request-response | Enhanced with search input — Organization table has no search. Use RESEARCH.md debounce pattern (lines 480-501). |

## Metadata

**Analog search scope:** `packages/service/src/routes/`, `apps/admin/src/app/(logged)/`, `packages/service/prisma/`, `apps/admin/messages/`
**Files scanned:** 15
**Pattern extraction date:** 2026-05-20
