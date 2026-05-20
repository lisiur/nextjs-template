# Requirements: 应用与菜单管理系统

**Defined:** 2026-05-20
**Core Value:** 动态菜单管理取代硬编码导航，支持多应用、多级菜单、角色权限控制

## v1 Requirements

### 应用管理 (APP)

- [ ] **APP-01**: 管理员可以创建应用（名称、编码、描述）
- [ ] **APP-02**: 管理员可以编辑应用信息
- [ ] **APP-03**: 管理员可以删除应用（确认后删除）
- [ ] **APP-04**: 管理员可以搜索和筛选应用列表
- [ ] **APP-05**: 管理员可以上传应用 Logo

### 菜单管理 (MENU)

- [ ] **MENU-01**: 管理员可以创建多级嵌套菜单树
- [ ] **MENU-02**: 管理员可以编辑菜单属性（名称、图标、排序、码值）
- [ ] **MENU-03**: 管理员可以删除菜单项（级联处理子菜单）
- [ ] **MENU-04**: 管理员通过左右分栏界面管理菜单（左侧树形导航，右侧编辑表单）
- [ ] **MENU-05**: 管理员可以拖拽调整菜单排序（同级和跨级）
- [ ] **MENU-06**: 管理员可以通过图标选择器为菜单选择图标（支持搜索过滤）

### 权限控制 (RBAC)

- [ ] **RBAC-01**: 不同角色可以看到不同的菜单项
- [ ] **RBAC-02**: 前端侧边栏根据当前用户角色动态加载菜单

### 迁移 (MIGR)

- [ ] **MIGR-01**: 将当前硬编码的导航菜单迁移为数据库驱动的动态菜单

## v2 Requirements

### 批量操作

- **BATCH-01**: 管理员可以批量启用/禁用菜单项
- **BATCH-02**: 管理员可以批量删除菜单项

### 高级功能

- **ADV-01**: 菜单码值与前端路由映射预览
- **ADV-02**: 菜单树导入/导出（JSON 格式）
- **ADV-03**: 可视化菜单预览（保存前预览侧边栏效果）
- **ADV-04**: 菜单树内搜索（大型树中快速定位）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 前台展示菜单 | 当前只做后台管理 |
| 菜单权限码与前端路由自动同步 | 手动配置码值对应关系，避免前后端紧耦合 |
| 多语言菜单 | 当前只支持中文 |
| 实时协作编辑 | 菜单变更频率低，简单锁机制足够 |
| 菜单版本历史 | 数据库已有 createdAt/updatedAt，备份即可 |
| 嵌套权限继承 | 显式逐项分配更清晰，避免调试困惑 |
| 自定义应用主题 | 使用全局主题系统（next-themes） |
| 菜单点击分析 | 需要独立分析基础设施，不与菜单管理混用 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APP-01 | Phase 1: Foundation | Pending |
| APP-02 | Phase 1: Foundation | Pending |
| APP-03 | Phase 1: Foundation | Pending |
| APP-04 | Phase 1: Foundation | Pending |
| APP-05 | Phase 1: Foundation | Pending |
| MENU-01 | Phase 2: Menu Tree Management | Pending |
| MENU-02 | Phase 2: Menu Tree Management | Pending |
| MENU-03 | Phase 2: Menu Tree Management | Pending |
| MENU-04 | Phase 2: Menu Tree Management | Pending |
| MENU-05 | Phase 2: Menu Tree Management | Pending |
| MENU-06 | Phase 2: Menu Tree Management | Pending |
| RBAC-01 | Phase 3: RBAC & Menu Visibility | Pending |
| RBAC-02 | Phase 3: RBAC & Menu Visibility | Pending |
| MIGR-01 | Phase 4: Migration | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14 ✓
- Unmapped: 0

---
*Requirements defined: 2026-05-20*
*Last updated: 2026-05-20 after roadmap creation — traceability mapped*
