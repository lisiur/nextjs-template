# App-Scoped Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-application role scoping so users can have different roles in different applications, and menu assignments are scoped to roles within specific apps.

**Architecture:** Keep `User.role` as a global baseline for better-auth (admin route access). Add `Role` model (scoped to Application) and `UserRole` join table. Update `MenuRole` to reference `Role.id` instead of a plain string. The `GET /menu-role/mine` endpoint aggregates menus across all the user's app-scoped roles. The frontend role management UI becomes app-aware.

**Tech Stack:** Prisma 7 (PostgreSQL), Hono (OpenAPIHono), Zod 4, React 19, next-intl, shadcn/ui

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `packages/service/src/repositories/role.repository.ts` | CRUD for `Role` model |
| `packages/service/src/repositories/user-role.repository.ts` | CRUD for `UserRole` join table |
| `packages/service/src/routes/role/index.ts` | Role CRUD route group (admin-only) |
| `packages/service/src/routes/role/schema.ts` | Zod schemas for role routes |
| `packages/service/src/routes/role/listRoles.ts` | List roles for an application |
| `packages/service/src/routes/role/createRole.ts` | Create a role within an application |
| `packages/service/src/routes/role/updateRole.ts` | Update role name/code |
| `packages/service/src/routes/role/deleteRole.ts` | Delete a role |
| `packages/service/src/routes/user-role/index.ts` | UserRole route group (admin-only) |
| `packages/service/src/routes/user-role/schema.ts` | Zod schemas for user-role routes |
| `packages/service/src/routes/user-role/assignUserRole.ts` | Assign a role to a user for an app |
| `packages/service/src/routes/user-role/removeUserRole.ts` | Remove a user's role from an app |
| `packages/service/src/routes/user-role/listUserRoles.ts` | List roles assigned to a user |
| `packages/service/src/routes/user-role/getUserAppRoles.ts` | Get menus from all user's app roles |

### Modified files
| File | Change |
|------|--------|
| `packages/service/prisma/schema.prisma` | Add `Role`, `UserRole` models; update `MenuRole` FK; add relations to `Application` and `User` |
| `packages/service/src/repositories/menu-role.repository.ts` | `roleId` now references Role.id FK |
| `packages/service/src/routes/menu-role/schema.ts` | `roleId` example changes to cuid |
| `packages/service/src/routes/menu-role/getMine.ts` | Use `userRoleRepository.getMenusForUser()` instead of `session.user.role` |
| `packages/service/src/routes/index.ts` | Mount new `roleRoutes` and `userRoleRoutes` |
| `packages/service/prisma/seed.ts` | Create Role records; use Role.id in MenuRole seed |
| `packages/service/src/lib/permissions.ts` | Delete (unused duplicate) |
| `apps/admin/src/app/(logged)/roles/page.tsx` | Keep as-is |
| `apps/admin/src/app/(logged)/roles/components/role-table.tsx` | Rewrite: fetch roles from API per selected app |
| `apps/admin/src/app/(logged)/roles/components/role-detail-dialog.tsx` | Delete (hardcoded permissions no longer relevant) |
| `apps/admin/src/app/(logged)/roles/[roleId]/menus/page.tsx` | Update to use Role.id from URL params |
| `apps/admin/src/app/(logged)/users/components/user-dialog.tsx` | Add per-app role assignment UI |
| `apps/admin/src/app/(logged)/users/components/user-table.tsx` | Minor: keep global role badge |

---

## Task 1: Update Prisma Schema

**Files:**
- Modify: `packages/service/prisma/schema.prisma`

- [ ] **Step 1: Add Role and UserRole models, update MenuRole and Application**

Add the following to `schema.prisma`:

```prisma
model Role {
  id        String   @id @default(cuid())
  appId     String
  app       Application @relation(fields: [appId], references: [id], onDelete: Cascade)
  name      String
  code      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  menuRoles MenuRole[]
  userRoles UserRole[]

  @@unique([appId, code])
  @@index([appId])
  @@map("role")
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_role")
}
```

Update the existing `MenuRole` model — add a relation to Role:

```prisma
model MenuRole {
  id        String   @id @default(cuid())
  menuId    String
  menu      Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([menuId, roleId])
  @@index([menuId])
  @@index([roleId])
  @@map("menu_role")
}
```

Update the `Application` model to add the `roles` relation:

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
  roles       Role[]

  @@unique([code])
  @@index([deletedAt])
  @@map("application")
}
```

Update the `User` model to add the `userRoles` relation:

```prisma
model User {
  id            String       @id @default(cuid())
  name          String
  email         String
  emailVerified Boolean      @default(false)
  image         String?
  role          String?
  banned        Boolean?     @default(false)
  banReason     String?
  banExpires    DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  sessions      Session[]
  accounts      Account[]
  members       Member[]
  invitations   Invitation[]
  uploads       Upload[]
  userRoles     UserRole[]

  @@unique([email])
  @@map("user")
}
```

- [ ] **Step 2: Run Prisma generate and push**

Run:
```bash
pnpm db:generate && pnpm db:push
```

Expected: Schema updates applied, new tables created.

- [ ] **Step 3: Commit**

```bash
git add packages/service/prisma/schema.prisma
git commit -m "feat: add Role and UserRole models, update MenuRole FK"
```

---

## Task 2: Create Role Repository

**Files:**
- Create: `packages/service/src/repositories/role.repository.ts`

- [ ] **Step 1: Create role.repository.ts**

```ts
import { prisma } from "../lib/db";

export const roleRepository = {
  findByAppId(appId: string) {
    return prisma.role.findMany({
      where: { appId },
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.role.findUnique({ where: { id } });
  },

  findByAppAndCode(appId: string, code: string) {
    return prisma.role.findUnique({
      where: { appId_code: { appId, code } },
    });
  },

  create(data: { appId: string; name: string; code: string }) {
    return prisma.role.create({ data });
  },

  update(id: string, data: { name?: string; code?: string }) {
    return prisma.role.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.role.delete({ where: { id } });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/service/src/repositories/role.repository.ts
git commit -m "feat: add role repository"
```

---

## Task 3: Create UserRole Repository

**Files:**
- Create: `packages/service/src/repositories/user-role.repository.ts`

- [ ] **Step 1: Create user-role.repository.ts**

```ts
import { prisma } from "../lib/db";

export const userRoleRepository = {
  findByUser(userId: string) {
    return prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  },

  findByUserAndRole(userId: string, roleId: string) {
    return prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
  },

  assign(userId: string, roleId: string) {
    return prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  },

  remove(userId: string, roleId: string) {
    return prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  },

  getMenusForUser(userId: string) {
    return prisma.menu.findMany({
      where: {
        menuRoles: {
          some: {
            role: {
              userRoles: { some: { userId } },
            },
          },
        },
        isVisible: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/service/src/repositories/user-role.repository.ts
git commit -m "feat: add user-role repository"
```

---

## Task 4: Update MenuRole Repository

**Files:**
- Modify: `packages/service/src/repositories/menu-role.repository.ts`

- [ ] **Step 1: Update menu-role.repository.ts**

The methods stay the same shape — `roleId` is now a Role.id FK instead of a plain string. Callers will pass Role.id values.

```ts
import { prisma } from "../lib/db";

export const menuRoleRepository = {
  findByRole(roleId: string) {
    return prisma.menuRole.findMany({
      where: { roleId },
      include: { menu: true },
    });
  },

  batchAssign(roleId: string, menuIds: string[]) {
    return prisma.$transaction([
      prisma.menuRole.deleteMany({ where: { roleId } }),
      prisma.menuRole.createMany({
        data: menuIds.map((menuId) => ({ menuId, roleId })),
      }),
    ]);
  },

  getMenusForRole(roleId: string) {
    return prisma.menu.findMany({
      where: {
        menuRoles: { some: { roleId } },
        isVisible: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  },

  findAllMenus() {
    return prisma.menu.findMany({
      orderBy: { sortOrder: "asc" },
    });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/service/src/repositories/menu-role.repository.ts
git commit -m "refactor: menu-role repository now uses Role FK"
```

---

## Task 5: Create Role API Routes

**Files:**
- Create: `packages/service/src/routes/role/schema.ts`
- Create: `packages/service/src/routes/role/listRoles.ts`
- Create: `packages/service/src/routes/role/createRole.ts`
- Create: `packages/service/src/routes/role/updateRole.ts`
- Create: `packages/service/src/routes/role/deleteRole.ts`
- Create: `packages/service/src/routes/role/index.ts`

- [ ] **Step 1: Create schema.ts**

```ts
import { z } from "@hono/zod-openapi";

export const roleSchema = z
  .object({
    id: z.string().openapi({ example: "clx1234567890" }),
    appId: z.string().openapi({ example: "app-admin" }),
    name: z.string().openapi({ example: "Administrator" }),
    code: z.string().openapi({ example: "admin" }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("Role");

export const listRolesQuerySchema = z.object({
  appId: z.string().min(1),
});

export const createRoleBodySchema = z.object({
  appId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
});

export const updateRoleBodySchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

export const roleIdParamSchema = z.object({
  id: z.string().min(1),
});

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");
```

- [ ] **Step 2: Create listRoles.ts**

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { roleRepository } from "../../repositories/role.repository";
import { errorSchema, listRolesQuerySchema, roleSchema } from "./schema";

export const listRoles = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Role"],
    summary: "List roles for an application",
    request: {
      query: listRolesQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: roleSchema.array() },
        },
        description: "List of roles",
      },
      401: {
        content: { "application/json": { schema: errorSchema } },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const { appId } = c.req.valid("query");
    const roles = await roleRepository.findByAppId(appId);
    return c.json(roles, 200);
  },
});
```

- [ ] **Step 3: Create createRole.ts**

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { roleRepository } from "../../repositories/role.repository";
import { createRoleBodySchema, errorSchema, roleSchema } from "./schema";

export const createRole = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/",
    tags: ["Role"],
    summary: "Create a role",
    request: {
      body: {
        content: {
          "application/json": { schema: createRoleBodySchema },
        },
        required: true,
      },
    },
    responses: {
      201: {
        content: { "application/json": { schema: roleSchema } },
        description: "Created role",
      },
      400: {
        content: { "application/json": { schema: errorSchema } },
        description: "Bad Request",
      },
    },
  }),
  handler: async (c) => {
    const data = c.req.valid("json");
    const existing = await roleRepository.findByAppAndCode(data.appId, data.code);
    if (existing) {
      return c.json(
        { code: 400, message: "Role code already exists in this application" },
        400,
      );
    }
    const role = await roleRepository.create(data);
    return c.json(role, 201);
  },
});
```

- [ ] **Step 4: Create updateRole.ts**

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { roleRepository } from "../../repositories/role.repository";
import {
  errorSchema,
  roleIdParamSchema,
  roleSchema,
  updateRoleBodySchema,
} from "./schema";

export const updateRole = defineOpenAPIRoute({
  route: createRoute({
    method: "put",
    path: "/{id}",
    tags: ["Role"],
    summary: "Update a role",
    request: {
      params: roleIdParamSchema,
      body: {
        content: {
          "application/json": { schema: updateRoleBodySchema },
        },
        required: true,
      },
    },
    responses: {
      200: {
        content: { "application/json": { schema: roleSchema } },
        description: "Updated role",
      },
      404: {
        content: { "application/json": { schema: errorSchema } },
        description: "Not Found",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const role = await roleRepository.findById(id);
    if (!role) {
      return c.json({ code: 404, message: "Role not found" }, 404);
    }
    const updated = await roleRepository.update(id, data);
    return c.json(updated, 200);
  },
});
```

- [ ] **Step 5: Create deleteRole.ts**

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { prisma } from "../../lib/db";
import { roleRepository } from "../../repositories/role.repository";
import { errorSchema, roleIdParamSchema } from "./schema";

export const deleteRole = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Role"],
    summary: "Delete a role",
    request: {
      params: roleIdParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { success: { type: "boolean" } },
            },
          },
        },
        description: "Deleted",
      },
      404: {
        content: { "application/json": { schema: errorSchema } },
        description: "Not Found",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");
    const role = await roleRepository.findById(id);
    if (!role) {
      return c.json({ code: 404, message: "Role not found" }, 404);
    }
    await prisma.$transaction([
      prisma.menuRole.deleteMany({ where: { roleId: id } }),
      prisma.userRole.deleteMany({ where: { roleId: id } }),
      prisma.role.delete({ where: { id } }),
    ]);
    return c.json({ success: true }, 200);
  },
});
```

- [ ] **Step 6: Create index.ts**

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { createRole } from "./createRole";
import { deleteRole } from "./deleteRole";
import { listRoles } from "./listRoles";
import { updateRole } from "./updateRole";

const roleRoutes = new OpenAPIHono();

roleRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

const routes = roleRoutes.openapiRoutes([
  listRoles,
  createRole,
  updateRole,
  deleteRole,
] as const);

export { routes as roleRoutes };
```

- [ ] **Step 7: Commit**

```bash
git add packages/service/src/routes/role/
git commit -m "feat: add role CRUD routes"
```

---

## Task 6: Create UserRole API Routes

**Files:**
- Create: `packages/service/src/routes/user-role/schema.ts`
- Create: `packages/service/src/routes/user-role/assignUserRole.ts`
- Create: `packages/service/src/routes/user-role/removeUserRole.ts`
- Create: `packages/service/src/routes/user-role/listUserRoles.ts`
- Create: `packages/service/src/routes/user-role/getUserAppRoles.ts`
- Create: `packages/service/src/routes/user-role/index.ts`

- [ ] **Step 1: Create schema.ts**

```ts
import { z } from "@hono/zod-openapi";

export const userRoleSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    roleId: z.string(),
    role: z.object({
      id: z.string(),
      appId: z.string(),
      name: z.string(),
      code: z.string(),
    }),
    createdAt: z.date(),
  })
  .openapi("UserRole");

export const assignUserRoleBodySchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});

export const removeUserRoleParamSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});

export const listUserRolesQuerySchema = z.object({
  userId: z.string().min(1),
});

export const errorSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Bad Request" }),
  })
  .openapi("Error");
```

- [ ] **Step 2: Create assignUserRole.ts**

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { userRoleRepository } from "../../repositories/user-role.repository";
import {
  assignUserRoleBodySchema,
  errorSchema,
  userRoleSchema,
} from "./schema";

export const assignUserRole = defineOpenAPIRoute({
  route: createRoute({
    method: "post",
    path: "/",
    tags: ["UserRole"],
    summary: "Assign a role to a user",
    request: {
      body: {
        content: {
          "application/json": { schema: assignUserRoleBodySchema },
        },
        required: true,
      },
    },
    responses: {
      200: {
        content: { "application/json": { schema: userRoleSchema } },
        description: "Assigned user role",
      },
      400: {
        content: { "application/json": { schema: errorSchema } },
        description: "Bad Request",
      },
    },
  }),
  handler: async (c) => {
    const { userId, roleId } = c.req.valid("json");
    const userRole = await userRoleRepository.assign(userId, roleId);
    return c.json(userRole, 200);
  },
});
```

- [ ] **Step 3: Create removeUserRole.ts**

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { userRoleRepository } from "../../repositories/user-role.repository";
import { errorSchema, removeUserRoleParamSchema } from "./schema";

export const removeUserRole = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/{userId}/{roleId}",
    tags: ["UserRole"],
    summary: "Remove a role from a user",
    request: {
      params: removeUserRoleParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { success: { type: "boolean" } },
            },
          },
        },
        description: "Removed",
      },
    },
  }),
  handler: async (c) => {
    const { userId, roleId } = c.req.valid("param");
    await userRoleRepository.remove(userId, roleId);
    return c.json({ success: true }, 200);
  },
});
```

- [ ] **Step 4: Create listUserRoles.ts**

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { userRoleRepository } from "../../repositories/user-role.repository";
import {
  errorSchema,
  listUserRolesQuerySchema,
  userRoleSchema,
} from "./schema";

export const listUserRoles = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["UserRole"],
    summary: "List roles for a user",
    request: {
      query: listUserRolesQuerySchema,
    },
    responses: {
      200: {
        content: { "application/json": { schema: userRoleSchema.array() } },
        description: "User roles",
      },
    },
  }),
  handler: async (c) => {
    const { userId } = c.req.valid("query");
    const userRoles = await userRoleRepository.findByUser(userId);
    return c.json(userRoles, 200);
  },
});
```

- [ ] **Step 5: Create getUserAppRoles.ts**

Returns the current user's menus aggregated from all their per-app roles. This replaces the old `GET /menu-role/mine` behavior.

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { userRoleRepository } from "../../repositories/user-role.repository";
import { menuSchema } from "../menu/schema";
import { errorSchema } from "./schema";

export const getUserAppRoles = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/mine",
    tags: ["UserRole"],
    summary: "Get current user's menus from all app-scoped roles",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { menus: menuSchema.array() },
            },
          },
        },
        description: "User's authorized menus across all applications",
      },
      401: {
        content: { "application/json": { schema: errorSchema } },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const menus = await userRoleRepository.getMenusForUser(session.user.id);
    return c.json({ menus }, 200);
  },
});
```

- [ ] **Step 6: Create index.ts**

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { assignUserRole } from "./assignUserRole";
import { getUserAppRoles } from "./getUserAppRoles";
import { listUserRoles } from "./listUserRoles";
import { removeUserRole } from "./removeUserRole";

const adminRoutes = new OpenAPIHono();

adminRoutes.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    throw new HTTPException(401, { message: "Admin access required" });
  }
  return next();
});

const publicRoutes = new OpenAPIHono();

const adminPart = adminRoutes.openapiRoutes([
  assignUserRole,
  removeUserRole,
  listUserRoles,
] as const);

const publicPart = publicRoutes.openapiRoutes([getUserAppRoles] as const);

const routes = publicPart.route("/", adminPart);

export { routes as userRoleRoutes };
```

- [ ] **Step 7: Commit**

```bash
git add packages/service/src/routes/user-role/
git commit -m "feat: add user-role routes (assign, remove, list, mine)"
```

---

## Task 7: Update Menu-Role GetMine Route

**Files:**
- Modify: `packages/service/src/routes/menu-role/getMine.ts`

- [ ] **Step 1: Update getMine.ts**

Replace `session.user.role` with `userRoleRepository.getMenusForUser()`:

```ts
import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../lib/auth";
import { userRoleRepository } from "../../repositories/user-role.repository";
import { errorSchema, mineMenusResponseSchema } from "./schema";

export const getMine = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/mine",
    tags: ["Menu"],
    summary: "Get current user's authorized menus",
    description:
      "Returns menus authorized for the current user across all their app-scoped roles.",
    responses: {
      200: {
        content: {
          "application/json": { schema: mineMenusResponseSchema },
        },
        description: "Menus authorized for the current user",
      },
      401: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Unauthorized",
      },
    },
  }),
  handler: async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const menus = await userRoleRepository.getMenusForUser(session.user.id);
    return c.json({ menus }, 200);
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/service/src/routes/menu-role/getMine.ts
git commit -m "refactor: getMine uses userRoleRepository for per-app roles"
```

---

## Task 8: Mount New Routes and Clean Up

**Files:**
- Modify: `packages/service/src/routes/index.ts`
- Delete: `packages/service/src/lib/permissions.ts`

- [ ] **Step 1: Update routes/index.ts**

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { applicationRoutes } from "./application";
import { authRoutes } from "./auth.routes";
import { menuRoutes } from "./menu";
import { menuRoleRoutes } from "./menu-role";
import { organizationRoutes } from "./organization";
import { roleRoutes } from "./role";
import { systemConfigRoutes } from "./system-config";
import { uploadRoutes } from "./upload";
import { userRoleRoutes } from "./user-role";

const routes = new OpenAPIHono()
  .route("/auth", authRoutes)
  .route("/system-config", systemConfigRoutes)
  .route("/organizations", organizationRoutes)
  .route("/applications", applicationRoutes)
  .route("/menu", menuRoutes)
  .route("/menu-role", menuRoleRoutes)
  .route("/roles", roleRoutes)
  .route("/user-roles", userRoleRoutes)
  .route("/upload", uploadRoutes);

export { routes };
```

- [ ] **Step 2: Delete unused duplicate permissions file**

```bash
rm packages/service/src/lib/permissions.ts
```

- [ ] **Step 3: Commit**

```bash
git add packages/service/src/routes/index.ts packages/service/src/lib/permissions.ts
git commit -m "feat: mount role and user-role routes, remove duplicate permissions"
```

---

## Task 9: Update Seed Script

**Files:**
- Modify: `packages/service/prisma/seed.ts`

- [ ] **Step 1: Update seed.ts**

Add a `seedRoles` function and update `seedMenuRoles` to use Role.id:

```ts
async function seedRoles(appId: string) {
  console.log("Seeding roles...");

  const roleDefinitions = [
    { name: "Administrator", code: "admin" },
    { name: "Manager", code: "manager" },
    { name: "User", code: "user" },
  ];

  const roleIds: Record<string, string> = {};

  for (const def of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { appId_code: { appId, code: def.code } },
      update: { name: def.name },
      create: { appId, name: def.name, code: def.code },
    });
    roleIds[def.code] = role.id;
  }

  console.log(`Seeded ${Object.keys(roleIds).length} roles.`);
  return roleIds;
}
```

Update the `seed()` function to call `seedRoles` and pass the role ID:

```ts
async function seed() {
  console.log("Seeding system configs...");

  for (const config of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: {
        group_key: {
          group: config.group,
          key: config.key,
        },
      },
      update: { label: config.label, description: config.description },
      create: config,
    });
  }

  console.log(`Seeded ${defaultConfigs.length} default configurations.`);

  const adminApp = await seedAdminApplication();
  const menuIds = await seedMenus(adminApp.id);
  const roleIds = await seedRoles(adminApp.id);
  await seedMenuRoles(menuIds, roleIds.admin);
}
```

- [ ] **Step 2: Run seed**

```bash
pnpm db:seed
```

Expected: Roles created, menus assigned to the admin role using Role.id.

- [ ] **Step 3: Commit**

```bash
git add packages/service/prisma/seed.ts
git commit -m "feat: update seed to create Role records and use Role.id"
```

---

## Task 10: Update Frontend — Role Management Page

**Files:**
- Modify: `apps/admin/src/app/(logged)/roles/components/role-table.tsx`
- Delete: `apps/admin/src/app/(logged)/roles/components/role-detail-dialog.tsx`
- Modify: `apps/admin/src/app/(logged)/roles/[roleId]/menus/page.tsx`

- [ ] **Step 1: Rewrite role-table.tsx**

Replace the hardcoded roles array with dynamic fetching per selected app:

```tsx
"use client";

import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appClient } from "@/lib/api";

interface Role {
  id: string;
  appId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: string;
  name: string;
  code: string;
}

export function RoleTable() {
  const t = useTranslations("Roles");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await appClient.api.applications.$get();
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications ?? []);
      }
    } catch {
      toast.error(t("loadError"));
    }
  }, [t]);

  const fetchRoles = useCallback(
    async (appId: string) => {
      setLoading(true);
      try {
        const res = await appClient.api.roles.$get({ query: { appId } });
        if (res.ok) {
          const data = await res.json();
          setRoles(data);
        }
      } catch {
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (selectedApp) {
      fetchRoles(selectedApp.id);
    }
  }, [selectedApp, fetchRoles]);

  async function handleDelete(role: Role) {
    try {
      const res = await appClient.api.roles[":id"].$delete({
        param: { id: role.id },
      });
      if (res.ok) {
        toast.success(t("deleteSuccess"));
        if (selectedApp) fetchRoles(selectedApp.id);
      }
    } catch {
      toast.error(t("deleteError"));
    }
  }

  return (
    <div className="flex gap-6">
      <div className="w-48 shrink-0">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
          {t("applications")}
        </h3>
        <div className="space-y-0.5">
          {applications.map((app) => (
            <button
              key={app.id}
              type="button"
              className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                selectedApp?.id === app.id ? "bg-accent font-medium" : ""
              }`}
              onClick={() => setSelectedApp(app)}
            >
              {app.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {selectedApp ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedApp.name} — {t("title")}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("code")}</TableHead>
                    <TableHead className="text-right">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        {role.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{role.code}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          render={<Link href={`/roles/${role.id}/menus`} />}
                        >
                          <ListChecks className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        {t("noRoles")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">{t("selectApp")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete role-detail-dialog.tsx**

```bash
rm apps/admin/src/app/(logged)/roles/components/role-detail-dialog.tsx
```

- [ ] **Step 3: Update roles/[roleId]/menus/page.tsx**

Remove the hardcoded `roleNames` map. The `roleId` is now a Role.id (cuid). The page title can show the roleId or be improved later with a get-by-id endpoint.

Key changes:
- Remove `const roleNames: Record<string, string> = { ... }`
- Update the header to show `roleId` directly (or fetch role info)
- The rest of the logic (fetching apps, menus, saving) stays the same

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/(logged)/roles/
git commit -m "feat: update role management UI for app-scoped roles"
```

---

## Task 11: Update Frontend — User Dialog

**Files:**
- Modify: `apps/admin/src/app/(logged)/users/components/user-dialog.tsx`

- [ ] **Step 1: Add per-app role assignment UI**

After the existing global role `<Select>`, add a section for per-app role assignments. This requires:
1. Fetching applications when the dialog opens
2. Fetching roles for a selected app
3. Fetching the user's existing UserRole records
4. Assign/remove handlers

Add state and effects:
```tsx
const [applications, setApplications] = useState<Application[]>([]);
const [appRoles, setAppRoles] = useState<Role[]>([]);
const [userRoles, setUserRoles] = useState<UserRole[]>([]);
const [selectedAppId, setSelectedAppId] = useState<string>("");

useEffect(() => {
  if (open) {
    appClient.api.applications.$get().then((res) => {
      if (res.ok) res.json().then((d) => setApplications(d.applications ?? []));
    });
  }
}, [open]);

useEffect(() => {
  if (selectedAppId) {
    appClient.api.roles.$get({ query: { appId: selectedAppId } }).then((res) => {
      if (res.ok) res.json().then((d) => setAppRoles(d));
    });
  }
}, [selectedAppId]);

useEffect(() => {
  if (user?.id && open) {
    appClient.api["user-roles"].$get({ query: { userId: user.id } }).then((res) => {
      if (res.ok) res.json().then((d) => setUserRoles(d));
    });
  }
}, [user?.id, open]);
```

Add handlers:
```tsx
async function handleAssignRole(roleId: string) {
  if (!user?.id) return;
  await appClient.api["user-roles"].$post({ json: { userId: user.id, roleId } });
  const res = await appClient.api["user-roles"].$get({ query: { userId: user.id } });
  if (res.ok) {
    const d = await res.json();
    setUserRoles(d);
  }
}

async function handleRemoveRole(roleId: string) {
  if (!user?.id) return;
  await appClient.api["user-roles"][":userId"][":roleId"].$delete({
    param: { userId: user.id, roleId },
  });
  const res = await appClient.api["user-roles"].$get({ query: { userId: user.id } });
  if (res.ok) {
    const d = await res.json();
    setUserRoles(d);
  }
}
```

Add UI section after the global role selector:
```tsx
<div className="space-y-2">
  <Label>{t("appRoles")}</Label>
  <div className="rounded-md border p-3 space-y-2">
    {userRoles.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {userRoles.map((ur) => (
          <Badge key={ur.id} variant="secondary" className="gap-1">
            {ur.role.name} ({applications.find((a) => a.id === ur.role.appId)?.name ?? "?"})
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => handleRemoveRole(ur.roleId)}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
    )}
    <div className="flex gap-2">
      <Select value={selectedAppId} onValueChange={setSelectedAppId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("selectApp")} />
        </SelectTrigger>
        <SelectContent>
          {applications.map((app) => (
            <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedAppId && (
        <Select onValueChange={(roleId) => { handleAssignRole(roleId); setSelectedAppId(""); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("selectRole")} />
          </SelectTrigger>
          <SelectContent>
            {appRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/(logged)/users/components/user-dialog.tsx
git commit -m "feat: add per-app role assignment in user dialog"
```

---

## Task 12: Verify and Test

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Expected: No errors (fix any that appear).

- [ ] **Step 2: Run build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Manual verification**

1. `pnpm dev`
2. Go to `/roles` — select "Admin Panel" app
3. Create roles: "admin", "editor", "viewer"
4. Go to `/users` — edit a user, assign them "editor" in Admin Panel
5. Go to `/roles/<admin-role-id>/menus` — assign Dashboard + Settings menus
6. Go to `/roles/<editor-role-id>/menus` — assign only Dashboard
7. Log in as the edited user — verify they see only Dashboard
8. Verify the super-admin user still sees all menus

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix: lint and build fixes for app-scoped roles"
```

---

## Migration Notes

### Breaking Changes
- `GET /menu-role/mine` — now uses `userRoleRepository.getMenusForUser()`. Users without `UserRole` records will see **no menus**. Create `UserRole` records for all existing users after migration.
- `PUT /menu-role/batch` — `roleId` is now a Role.id (cuid), not a role name string.
- `GET /menu-role/{roleId}` — same change.
- `User.role` (global) is still used for admin route middleware. Keep it set.

### Data Migration (if existing data)
1. Create `Role` records for each application
2. Update `MenuRole.roleId` from string names to Role.id values
3. Create `UserRole` records based on existing `User.role` values
