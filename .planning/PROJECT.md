# 应用与菜单管理系统

## What This Is

为 admin 面板构建应用管理和动态菜单管理系统。每个业务系统（如 OA、CRM）作为一个「应用」，拥有独立的菜单树。菜单支持多级嵌套，基于角色控制可见性，取代当前硬编码的导航方式。

## Core Value

动态菜单管理取代硬编码导航，支持多应用、多级菜单、角色权限控制，让管理员无需改代码即可配置导航结构。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 应用管理 CRUD（名称、编码、描述、Logo）
- [ ] 应用列表展示与搜索
- [ ] 应用状态管理（启用/禁用）
- [ ] 菜单树管理（多级嵌套）
- [ ] 菜单属性管理（名称、图标、排序、码值）
- [ ] 菜单与应用关联（每个应用独立菜单树）
- [ ] 基于角色的菜单可见性控制
- [ ] 左右分栏交互界面（左侧树形导航，右侧编辑表单）
- [ ] 菜单拖拽排序
- [ ] 图标选择器
- [ ] 将当前硬编码菜单迁移为动态菜单

### Out of Scope

- 前台展示菜单 — 当前只做后台管理
- 菜单权限码与前端路由自动同步 — 手动配置码值对应关系
- 多语言菜单 — 当前只支持中文

## Context

- 现有技术栈：Next.js 16 + Hono + Prisma 7 + PostgreSQL
- 已有 better-auth RBAC 系统（admin、manager、user 角色）
- 当前 admin 面板导航菜单是硬编码的
- admin 面板本身将作为第一个「应用」纳入管理
- 后端没有路由概念，菜单码值与前端路由 meta.code 对应

## Constraints

- **技术栈**: 必须使用现有 Next.js + Hono + Prisma + better-auth — 已建立的基础设施
- **权限集成**: 必须与 better-auth RBAC 系统集成 — 统一权限管理
- **向后兼容**: 迁移硬编码菜单时不能破坏现有导航 — 用户体验连续性

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 每个应用独立菜单树 | 业务系统独立性强，菜单不共享 | — Pending |
| 菜单码值对应前端路由 meta | 后端无路由概念，通过码值关联 | — Pending |
| 左右分栏 UI | 符合后台管理系统常见交互模式 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-20 after initialization*
