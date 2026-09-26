# 权限系统

本项目实现了 **路由级权限** + **按钮级权限** 的双层权限控制体系，覆盖从前端路由到 UI 元素的完整访问管控。

## 权限模型

权限系统基于 **RBAC（Role-Based Access Control）** 模型设计，核心概念如下：

| 概念 | 说明 | 示例 |
|------|------|------|
| 角色 (Role) | 用户身份标识 | `super`、`admin`、`user`、`guest` |
| 权限码 (Permission) | 具体操作权限 | `user:create`、`user:delete` |
| 资源 (Resource) | 权限作用域 | `user`、`role`、`menu`、`settings`、`logs` |

### 权限枚举定义

```ts
// src/composables/web/permission/types.ts

/** 权限校验模式 */
enum PermissionMode {
  STRICT = 'strict',   // 严格模式：无权限时拒绝
  LOOSE = 'loose',     // 宽松模式：无权限时放行
}

/** 权限操作 */
enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  MANAGE = 'manage',
  ADMIN = 'admin',
}

/** 权限资源 */
enum PermissionResource {
  USER = 'user',
  ROLE = 'role',
  MENU = 'menu',
  SETTINGS = 'settings',
  LOGS = 'logs',
}

/** 预设角色 */
enum PermissionRole {
  SUPER = 'super',
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}
```

---

## 路由级权限控制

### meta.auth 配置

每个路由可通过 `meta` 字段配置权限要求，路由守卫在导航前进行校验：

```ts
// 路由配置示例
{
  path: '/system/user',
  name: 'SystemUser',
  component: () => import('~/views/system/user/index.vue'),
  meta: {
    title: '用户管理',
    requiresAuth: true,        // 需要登录
    permissions: ['user:read'], // 要求 user:read 权限
  },
}
```

### 路由守卫流程

路由守卫 (`src/router/guards.ts`) 按以下顺序执行权限校验：

```
用户访问路由
    │
    ▼
┌─ 登录校验 ─────────────────────┐
│  未登录 → 白名单路径？           │
│    ├─ 是 → 放行                │
│    └─ 否 → 重定向到 /login      │
│  已登录 → 访问 /login？         │
│    └─ 是 → 重定向到 /dashboard  │
└────────────────────────────────┘
    │
    ▼
┌─ 动态路由加载 ──────────────────┐
│  routeStore.isLoaded?            │
│    ├─ 是 → 继续                 │
│    └─ 否 → initBackendRoutes()   │
│         拉取 /auth/menus 生成路由 │
└────────────────────────────────┘
    │
    ▼
┌─ 权限校验 ─────────────────────┐
│  meta.permissions? → 校验权限码   │
│    └─ 不匹配 → 重定向到 /403     │
│  没有 → 放行                     │
└────────────────────────────────┘
    │
    ▼
  渲染页面 ✅
```

### 守卫源码

```ts
// src/router/guards.ts

// 白名单路径（无需登录）
const WHITE_LIST = ['/login', '/register', '/404', '/403', '/503']

function createAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const userStore = useUserStore()
    const isLoggedIn = userStore.isLoggedIn
    const requiresAuth = to.meta.requiresAuth !== false
    const isWhiteList = WHITE_LIST.includes(to.path)

    if (isLoggedIn) {
      if (to.path === '/login')
        return { path: '/dashboard', replace: true }
      return true
    }

    if (isWhiteList || !requiresAuth)
      return true

    return { path: '/login', query: { redirect: to.fullPath }, replace: true }
  })
}

function createPermissionGuard(router: Router) {
  router.beforeEach((to) => {
    const userStore = useUserStore()
    const requiredPermissions = to.meta.permissions as string[] | undefined

    // 权限校验：满足任一权限即可
    if (requiredPermissions) {
      const hasPermission = requiredPermissions.some(perm => userStore.hasPermission(perm))
      if (!hasPermission)
        return { path: '/403', replace: true }
    }

    return true
  })
}
```

---

## 按钮级权限指令

### v-permission 用法

通过 `v-permission` 自定义指令控制按钮/元素的显示与否：

#### 基础用法：单权限码

```vue
<template>
  <!-- 仅拥有 user:create 权限时显示 -->
  <a-button v-permission="'user:create'" type="primary">
    新建用户
  </a-button>

  <!-- 仅拥有 user:delete 权限时显示 -->
  <a-popconfirm
    v-permission="'user:delete'"
    title="确定删除该用户？"
    @confirm="handleDelete"
  >
    <a-button danger>删除</a-button>
  </a-popconfirm>
</template>
```

#### 数组权限：满足其一即可（默认行为）

```vue
<template>
  <!-- 拥有 user:edit 或 user:manage 任一权限即显示 -->
  <a-button v-permission="['user:edit', 'user:manage']">
    编辑
  </a-button>
</template>
```

#### 数组权限：全部满足（`.all` 修饰符）

```vue
<template>
  <!-- 必须同时拥有 user:edit 和 user:approve 权限 -->
  <a-button v-permission.all="['user:edit', 'user:approve']">
    审批编辑
  </a-button>
</template>
```

#### 角色校验（`:role` 参数）

```vue
<template>
  <!-- 校验角色而非权限码 -->
  <a-button v-permission:role="'admin'">
    管理员操作
  </a-button>

  <!-- 多角色，满足其一 -->
  <a-button v-permission:role="['admin', 'super']">
    高级操作
  </a-button>

  <!-- 多角色，全部满足 -->
  <a-button v-permission:role.all="['super', 'admin']">
    超管专属
  </a-button>
</template>
```

#### 超级管理员判断（`:admin` 参数）

```vue
<template>
  <!-- 仅 super 或 admin 角色可见 -->
  <div v-permission:admin>
    <a-button danger>危险区域操作</a-button>
  </div>
</template>
```

#### 默认行为：无权限时隐藏 + 禁用

```vue
<template>
  <!-- 无权限时 display:none，同时添加 disabled（默认隐藏模式） -->
  <a-button v-permission="'user:write'">写入</a-button>
</template>
```

#### `.disabled` 修饰符：禁用而非隐藏

```vue
<template>
  <!-- 无权限时禁用按钮，保留可见性 -->
  <a-button v-permission.disabled="'user:delete'" danger>
    删除
  </a-button>
</template>
```

### 指令完整逻辑

```ts
// src/directives/permission/index.ts
export const vPermission: Directive = {
  mounted(el, binding) {
    // 记录原始 display，便于权限恢复
    const state = {
      originalDisplay: el.style.display || '',
      disabledMode: !!binding.modifiers?.disabled,
    }
    performCheck(el, binding, state)
    // 监听权限变化，权限异步加载完成后自动重算
    watch(() => userStore.permissions, () => performCheck(el, binding, state), { deep: true })
  },
  updated(el, binding) {
    // 仅在 value / arg 真正变化时才重跑
    if (!isBindingChanged(state.prevBinding, binding)) return
    state.disabledMode = !!binding.modifiers?.disabled
    performCheck(el, binding, state)
  },
}

// src/directives/permission/utils.ts —— resolveAccess 的优先级
// 1. arg === 'role'  → hasRole / hasAnyRole / hasAllRoles（.all 决定任一/全部）
// 2. arg === 'admin' → isAdmin
// 3. value 为字符串  → hasPermission
// 4. value 为数组    → .all ? hasAllPermissions : hasAnyPermission
// 5. 未配置          → 默认有权限
function resolveAccess(binding, helpers) {
  const { value, arg, modifiers = {} } = binding

  if (arg === 'role') {
    if (Array.isArray(value)) {
      if (value.length === 0) return true
      return modifiers.all ? helpers.hasAllRoles(value) : helpers.hasAnyRole(value)
    }
    return helpers.hasRole(String(value ?? ''))
  }

  if (arg === 'admin') return helpers.isAdmin()

  if (value === undefined || value === null) return true
  if (typeof value === 'string') return helpers.hasPermission(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return true
    return modifiers.all ? helpers.hasAllPermissions(value) : helpers.hasAnyPermission(value)
  }

  return true
}
```

---

## Token 自动注入机制

Token 是权限验证的基础凭证，通过 Alova 请求拦截器自动注入：

```ts
// src/utils/token/index.ts
import { TOKEN_KEY } from '~/config/constants'
import { cache } from '~/utils/cache'

export function getToken(): string | null {
  const token = cache.getItem(TOKEN_KEY)
  return typeof token === 'string' ? token : null
}

export function setToken(token: string, expire?: number): void {
  cache.setItem(TOKEN_KEY, token, expire)
}

export function removeToken(): void {
  cache.removeItem(TOKEN_KEY)
}

export function clearAuth(): void {
  removeToken()
  cache.removeItem('auth-store')
  cache.removeItem('user-info')
}
```

### 请求拦截器注入

```ts
// Alova 实例配置中的 beforeRequest
beforeRequest(config) {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}
```

### Token 数据流

```
┌──────────┐    登录成功     ┌──────────────┐
│  Login    │ ─────────────→ │  setToken()   │
│  Page     │               │  写入 cache   │
└──────────┘               └──────┬───────┘
                                  │ 存储
                                  ▼
                          ┌──────────────┐
                          │ localStorage │
                          │  CacheStorage│
                          └──────┬───────┘
                                  │ 读取
                                  ▼
┌──────────┐    发起请求     ┌──────────────┐
│  Alova   │ ←──────────── │  getToken()   │
│  HTTP    │   自动注入Header│              │
└──────────┘               └──────────────┘
```

---

## 动态路由生成流程

路由表由 `src/stores/modules/route.ts` 统一管理，对外暴露两个初始化方法：

### 前端路由模式

```ts
// src/stores/modules/route.ts
const initFrontendRoutes = () => {
  // 前端菜单已在 routes 中静态注册，这里仅标记已加载
  isLoaded.value = true
}
```

### 后端路由模式

```ts
const initBackendRoutes = async () => {
  const backendMenus = await fetchBackendMenus() // 从 API 获取菜单数据
  menus.value = backendMenus as unknown as MenuConfig[]
  routes.value = generateBackendRoutes(backendMenus)
  isLoaded.value = true
}
```

### 菜单到路由的转换

```ts
function generateRoutesFromBackendMenus(backendMenus: BackendMenu[]): InternalRoute[] {
  return backendMenus
    .filter(menu => menu.status === '1' && menu.menuType !== 3) // 只处理启用的目录和菜单，忽略按钮
    .map((menu) => ({
      path: menu.path || '',
      name: menu.menuName,
      meta: {
        title: menu.menuName,
        icon: menu.icon,
        hidden: false,
        keepAlive: false,
        requiresAuth: true,
        roles: [],  // 预留字段
        permission: menu.permission ? [menu.permission] : [],
      },
      component: modules[`/src/${menu.component.replace(/^@\//, '')}`], // 动态导入
      children: menu.children?.length ? generateRoutesFromBackendMenus(menu.children) : undefined,
    }))
}
```

### 完整动态路由流程

```
用户登录成功
    │
    ▼
┌─ 首次访问受保护路由 ────────────┐
│  routeStore.isLoaded === false   │
└──────────────┬──────────────────┘
               │
               ▼
     initBackendRoutes()
     请求 GET /auth/menus
     返回菜单 JSON
              │
              ▼
     generateRoutesFromBackendMenus()
     递归转换菜单 → 路由配置
              │
              ▼
     await userStore.loadPermissions()
     routeStore.routes.forEach(router.addRoute)
     router.addRoute(catchAllRoute)
              │
              ▼
     routeStore.isLoaded = true
     重定向到目标路由 ✅
```

---

## 角色与菜单关联方式

### UserStore 中的权限数据

```ts
// src/stores/modules/user.ts
export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([]) // 由 loadPermissions() 从接口加载

  // 角色从 userInfo 派生
  const roles = computed(() => userInfo.value?.roles || [])

  // 单个权限判断（支持通配符 *）
  const hasPermission = (permission: string) => {
    if (permissions.value.includes('*'))
      return true
    return permissions.value.includes(permission)
  }

  // 单个角色判断
  const hasRole = (role: string) => {
    return roles.value.includes(role)
  }

  return { roles, permissions, hasPermission, hasRole }
})
```

### usePermission 组合式函数

提供更丰富的权限判断能力：

```ts
// src/composables/web/permission/usePermission.ts
export function usePermission(options = {}) {
  const userStore = useUserStore()

  return {
    // 权限判断
    hasPermission: (perm: string) => { /* ... */ },
    hasAnyPermission: (perms: string[]) => { /* 满足其一 */ },
    hasAllPermissions: (perms: string[]) => { /* 全部满足 */ },

    // 角色判断
    hasRole: (role: string) => { /* ... */ },
    hasAnyRole: (roles: string[]) => { /* 满足其一 */ },
    hasAllRoles: (roles: string[]) => { /* 全部满足 */ },

    // 超级管理员判断
    isAdmin: () => {
      return roles.value.includes('super') || roles.value.includes('admin')
    },

    // 组合校验：默认全部满足，mode: 'any' 时满足其一即可
    checkPermission: (perms: string | string[], opts?: { mode?: 'any' | 'all' }) => { /* ... */ },
    checkRole: (roles: string | string[], opts?: { mode?: 'any' | 'all' }) => { /* ... */ },

    // 当前用户的权限/角色列表（只读）
    permissions: readonly(permissions),
    roles: readonly(roles),
  }
}
```

### 在业务组件中使用

```vue
<script setup lang="ts">
import { usePermission } from '~/composables/web/permission'

const { hasPermission, hasAnyPermission, isAdmin, permissions, roles } = usePermission()

// 条件渲染
const canCreate = computed(() => hasPermission('user:create'))
const canManage = computed(() => hasAnyPermission(['user:manage', 'system:manage']))
const isSuperAdmin = computed(() => isAdmin())
</script>

<template>
  <div>
    <a-button v-if="canCreate" type="primary">新建</a-button>
    <a-tag v-if="isSuperAdmin" color="red">超级管理员</a-tag>
    <p>当前角色: {{ roles.join(', ') }}</p>
    <p>当前权限: {{ permissions.join(', ') }}</p>
  </div>
</template>
```

---

## 最佳实践

### 1. 权限码命名规范

```
资源:操作 格式
├── user:create      创建用户
├── user:read        查看用户
├── user:edit        编辑用户
├── user:delete      删除用户
├── user:export      导出用户
├── role:assign      分配角色
├── system:setting   系统设置
└── *               通配符（全部权限）
```

### 2. 路由权限 vs 按钮权限

| 场景 | 推荐方式 | 说明 |
|------|----------|------|
| 页面级访问控制 | `meta.permissions` | 路由守卫拦截 |
| 按钮/操作显隐 | `v-permission` 指令 | DOM 层面控制 |
| 业务逻辑条件判断 | `usePermission()` | JS 层面判断 |
| API 接口鉴权 | 后端 Token + 权限校验 | 永远不信任前端 |

### 3. 安全原则

::: warning 重要提醒
- **前端权限仅用于 UI 控制**，不能替代后端权限校验
- 所有敏感操作必须在服务端验证权限
- Token 应设置合理的过期时间，定期刷新
- 用户登出时必须清除所有认证信息（`clearAuth()`）
:::
