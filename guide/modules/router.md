# 路由系统

本项目使用 **Vue Router 4** 实现路由管理，支持静态路由与后端动态路由两种模式，通过多层守卫保障安全性。

## 路由文件结构

```
src/router/
├── index.ts      # 路由实例创建与守卫注册
├── routes.ts     # 静态路由定义（登录页、404 等）
└── guards.ts     # 路由守卫（认证、动态路由、权限、标题）
```

---

## 路由类型

### 静态路由（`routes.ts`）

静态路由在应用初始化时注册，不依赖后端接口：

```ts
// src/router/routes.ts

// 常量路由（应用初始化时注册）
export const constantRoutes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('~/views/login/index.vue') },
  { path: '/register', component: () => import('~/views/register/index.vue') },
  { path: '/404', component: () => import('~/views/error/404.vue') },
  { path: '/403', component: () => import('~/views/error/403.vue') },
  { path: '/503', component: () => import('~/views/error/503.vue') },
]

// 兜底路由（动态路由就绪后再注册）
export const catchAllRoute = {
  path: '/:pathMatch(.*)*',
  redirect: '/404',
}
```

### 动态路由

动态路由从 `GET /auth/menus` 接口获取，由 `useRouteStore.initBackendRoutes()` 生成后调用 `router.addRoute()` 注册。

---

## 路由 Meta 字段

每个路由的 `meta` 字段控制守卫行为和页面渲染：

```ts
interface RouteMeta {
  title: string           // 页面标题（显示在 document.title 和面包屑）
  icon?: string           // 菜单图标（Iconify 格式）
  hidden?: boolean        // 是否隐藏于侧边栏菜单
  keepAlive?: boolean     // 是否缓存页面（KeepAlive）
  requiresAuth?: boolean  // 是否需要登录（默认 true）
  roles?: string[]        // 允许访问的角色列表
  permissions?: string[]  // 允许访问的权限码列表（路由级别）
  microApp?: MicroAppConfig  // 微前端应用配置
  isExternal?: boolean    // 是否外部链接
  layout?: 'blank' | 'default' | null  // 布局模式（blank 表示全屏无布局）
}
```

### 示例

```ts
// 正常业务路由
{
  path: '/system/user',
  name: 'SystemUser',
  component: () => import('~/views/system/user/index.vue'),
  meta: {
    title: '用户管理',
    icon: 'carbon:user',
    requiresAuth: true,
    permissions: ['user:read'],
    keepAlive: true,
  },
}

// 全屏布局路由（如大屏看板）
{
  path: '/dashboard/screen',
  name: 'DashboardScreen',
  component: () => import('~/views/screen/index.vue'),
  meta: {
    title: '数据大屏',
    layout: 'blank',   // 不渲染 DefaultLayout
    requiresAuth: true,
  },
}

// 无需登录的路由
{
  path: '/login',
  meta: { requiresAuth: false },
}
```

---

## 路由守卫

守卫通过 `setupRouterGuards(router)` 统一注册，执行顺序如下：

```
用户导航
    │
    ▼
① createProgressGuard     → NProgress 进度条
    │
    ▼
② createAuthGuard         → 登录校验（白名单放行）
    │
    ▼
③ createDynamicRouteGuard → 动态路由加载 + 字典预加载
    │
    ▼
④ createPermissionGuard   → meta.permissions 权限校验
    │
    ▼
⑤ createTitleGuard        → 更新 document.title + 滚动到顶部
    │
    ▼
⑥ createRouteLogGuard     → 路由跳转日志（当前为空实现）
```

### ① 进度条守卫

```ts
// beforeEach → NProgress.start()
// afterEach  → NProgress.done()
// onError    → NProgress.done()
```

通过 `nprogress` 在路由切换时显示顶部加载进度条。

### ② 认证守卫（createAuthGuard）

```ts
const WHITE_LIST = ['/login', '/register', '/404', '/403', '/503']

// 逻辑：
// 已登录 + 访问 /login → 重定向到 /dashboard
// 已登录 + 其他路由   → 放行
// 未登录 + 白名单     → 放行
// 未登录 + requiresAuth=false → 放行
// 未登录 + 受保护路由 → 重定向到 /login?redirect=...
```

### ③ 动态路由守卫（createDynamicRouteGuard）

```ts
// 逻辑：
// 未登录 → 跳过（让 createAuthGuard 处理）
// 已加载（routeStore.isLoaded = true）→ 检查路由是否注册，未注册则重置重加载
// 未加载 →
//   1. await routeStore.initBackendRoutes()   // 拉取菜单生成路由
//   2. await userStore.loadPermissions()       // 拉取权限
//   3. routeStore.routes.forEach(addRoute)     // 注册路由
//   4. router.addRoute(catchAllRoute)          // 注册兜底路由
//   5. return { ...to, replace: true }         // 重定向到目标页
```

**预加载字典**：路由已就绪时，异步预加载字典数据（非阻塞）：

```ts
const dictStore = useDictStore()
if (!dictStore.isLoaded && !dictStore.loading) {
  dictStore.fetchAllDicts()  // 不 await，不阻塞路由跳转
}
```

### ④ 权限守卫（createPermissionGuard）

```ts
// 读取 to.meta.permissions
// 用 hasPermission 判断权限码，满足任一即通过
// 不满足 → 重定向 /403
```

### ⑤ 标题守卫（createTitleGuard）

```ts
// afterEach 中执行：
// document.title = `${meta.title} | ${VITE_APP_TITLE}`
// window.scrollTo({ top: 0, behavior: 'instant' })
```

### ⑥ 路由日志守卫（createRouteLogGuard）

`createRouteLogGuard` 目前仅在 `afterEach` 中保留了白名单与首屏判断，**未实际写入日志**（空实现），保留待后续接入操作日志。

---

## 路由预加载

`src/utils/routePreload.ts` 提供菜单悬停 / 空闲时的路由组件预加载能力：

```ts
import { preloadRoute, preloadRoutes, useRoutePreloader } from '~/utils/routePreload'

// 预加载单个路由（返回是否成功）
await preloadRoute('/system/user')

// 批量预加载（内部限制并发为 2）
await preloadRoutes(['/system/user', '/system/role'])
```

`useRoutePreloader()` 返回 `isPreloading` / `preloadedPaths` 状态与 `prefetch(path)` / `predictAndPreload()` / `idlePreload()` / `cleanup()` 方法，适用于侧边栏菜单 hover 预加载场景，并会在组件卸载时自动清理。

---

## 动态路由加载流程

```
用户登录成功 → 访问受保护页面
    │
    ▼
routeStore.isLoaded === false
    │
    ▼
GET /auth/menus → backendMenus
    │
    ▼
generateRoutesFromBackendMenus()
    ├─ 过滤停用/按钮/外链/blank菜单
    ├─ 挂载到 DefaultLayout 的 children
    └─ blank 路由单独注册（全屏）
    │
    ▼
router.addRoute(mainLayoutRoute)
router.addRoute(...blankRoutes)
router.addRoute(catchAllRoute)
    │
    ▼
routeStore.isLoaded = true
    │
    ▼
{ ...to, replace: true }  → 重新导航到目标页
```

---

## 菜单 blank 布局路由

`layout === 'blank'` 的菜单不挂载在 `DefaultLayout` 下，直接注册为顶层路由，适用于：

- 数据大屏（全屏无边框）
- 第三方嵌入页
- 独立打印页

```ts
// 后端菜单配置
{
  menuName: '数据大屏',
  path: '/screen/overview',
  component: 'views/screen/index',
  layout: 'blank',
  status: '1',
}

// 生成的路由（不在 DefaultLayout children 中）
{
  path: '/screen/overview',
  name: '数据大屏',
  component: () => import('~/views/screen/index.vue'),
  meta: { title: '数据大屏', layout: 'blank' },
}
```

---

## 在组件中使用路由

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 获取当前路由参数
const id = route.params.id as string
const query = route.query

// 编程式导航
function goBack() {
  router.back()
}

function gotoDetail(id: string) {
  router.push({ name: 'UserDetail', params: { id } })
}

// 带 redirect 的登录跳转
const redirectPath = route.query.redirect as string || '/dashboard'
await userStore.login(...)
router.replace(redirectPath)
</script>
```

---

## 路由懒加载

所有业务页面均使用动态 `import()` 懒加载，避免首屏加载过多 JS：

```ts
// ✅ 懒加载（正确）
component: () => import('~/views/system/user/index.vue')

// ❌ 同步导入（错误，会影响首屏性能）
import UserView from '~/views/system/user/index.vue'
component: UserView
```

后端路由生成时使用 `import.meta.glob` 实现自动懒加载：

```ts
const modules = import.meta.glob('/src/views/**/*.vue')

// 使用时按路径取对应的懒加载函数
route.component = modules['/src/views/system/user/index.vue']
```

---

## 常见问题

### 页面刷新后路由消失（404）

动态路由在内存中，刷新后需要重新加载。守卫已处理此场景：

```ts
// createDynamicRouteGuard 检测到 routeStore.isLoaded === false
// 自动重新拉取菜单并注册路由
// 然后 return { ...to, replace: true } 重定向回目标页
```

### 具体路径放在动态参数前面

路由注册顺序影响匹配结果：

```ts
// ✅ 正确顺序
GET /user/export    // 先注册具体路径
GET /user/options
GET /user/:id       // 再注册动态参数

// ❌ 错误顺序
GET /user/:id       // /:id 会匹配 /user/export
GET /user/export    // 永远不会匹配到
```

### meta.requiresAuth 默认为 true

未明确设置 `requiresAuth: false` 的路由都需要登录，这是故意的设计——白名单应当是少数例外。
