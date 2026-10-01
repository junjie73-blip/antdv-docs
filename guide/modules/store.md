# 状态管理

本项目使用 **Pinia 3** 进行状态管理，所有 Store 模块位于 `src/stores/modules/` 目录下。

## Store 总览

| Store | 文件 | 职责 |
|-------|------|------|
| `useUserStore` | `user.ts` | 用户认证、登录/登出、权限判断 |
| `useAppStore` | `app.ts` | 主题、布局、语言、应用设置 |
| `useRouteStore` | `route.ts` | 动态路由生成与管理 |
| `useDictStore` | `dict.ts` | 数据字典加载与缓存 |
| `useTenantStore` | `tenant.ts` | 租户下拉选项加载 |

::: warning 废弃 Store
`stores/modules/auth.ts` 是历史遗留的重复实现（导出 `useAuthStore`，功能与 `useUserStore` 重叠，且全项目无引用），**不要使用**。用户状态的唯一入口是 `useUserStore`。
:::

---

## useUserStore

用户状态的唯一管理中心，负责认证、会话、权限判断。

### 引入方式

```ts
import { useUserStore } from '~/stores/modules/user'

const userStore = useUserStore()
```

### State

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | `Ref<string \| null>` | 访问令牌（启动时从 cache 恢复） |
| `refreshToken` | `Ref<string \| null>` | 刷新令牌 |
| `userInfo` | `Ref<UserInfo \| null>` | 当前用户信息 |
| `permissions` | `Ref<string[]>` | 权限码列表 |

### Getters（computed）

| 字段 | 类型 | 说明 |
|------|------|------|
| `isLoggedIn` | `ComputedRef<boolean>` | 是否已登录 |
| `username` | `ComputedRef<string>` | 用户名 |
| `nickname` | `ComputedRef<string>` | 真实姓名 |
| `avatar` | `ComputedRef<string>` | 头像 URL |
| `email` | `ComputedRef<string>` | 邮箱 |
| `phone` | `ComputedRef<string>` | 手机号 |
| `roles` | `ComputedRef<string[]>` | 角色列表（从 userInfo 派生） |

### Actions

#### `login(username, password, tenantCode, captcha)`

执行登录流程：

```ts
const result = await userStore.login('admin', 'admin123', 'DEFAULT', captcha)

if (result.success) {
  router.push('/dashboard')
} else {
  message.error(result.message)
}
```

完整流程：
1. `POST /auth/login` 获取 token 与用户基础信息
2. 写入 `cache`（同步落盘）再更新 ref
3. 调用 `GET /auth/profile` 获取完整用户资料
4. 调用 `loadPermissions()` 拉取权限列表
5. 返回 `{ success: true }` 或 `{ success: false, message }`

#### `logout()`

执行安全登出：

```ts
await userStore.logout()
```

流程：调用 `POST /auth/logout` → 清空所有 ref → `cache.clear()` → 跳转登录页 → `window.location.reload()`

::: tip 关于缓存清理范围
`logout` 会调用 `cache.clear()` 清除当前应用前缀下的所有缓存（不只是 auth 相关 key）。若需要保留主题等偏好设置，请在 `cache.clear()` 前单独保存这些值。
:::

#### `setUserInfo(info)`

```ts
userStore.setUserInfo(profile)
```

同步写入 `userInfo` ref 并更新 `cache`，**不再发请求**。

#### `loadPermissions()`

```ts
await userStore.loadPermissions()
```

调用 `GET /auth/permissions`，将权限码列表写入 `permissions` ref 和 `cache`。

#### `fetchCurrentUser()`

```ts
await userStore.fetchCurrentUser()
```

刷新场景兜底：token 有但 userInfo 丢失时调用，重新拉取个人资料并刷新权限。

#### `setToken(accessToken, refreshToken)`

```ts
userStore.setToken(newAccessToken, newRefreshToken)
```

Token 刷新后由 Alova 拦截器调用，更新 ref 和 cache。

#### `hasPermission(permission)`

```ts
if (userStore.hasPermission('user:create')) {
  // 显示新增按钮
}

// 通配符 * 表示拥有所有权限
// permissions.includes('*') → 超级管理员
```

#### `hasRole(role)`

```ts
if (userStore.hasRole('admin')) {
  // 管理员专属逻辑
}
```

### UserInfo 接口

```ts
interface UserInfo {
  userId: string       // UUID 字符串，禁止 Number()
  username: string
  realname: string
  avatar: string
  email: string
  phone: string
  roles: string[]
  permissions?: string[]
}
```

---

## useAppStore

全局应用设置的管理中心，负责主题、布局、语言等配置的读写与持久化。

### 引入方式

```ts
import { useAppStore } from '~/stores/modules/app'

const appStore = useAppStore()
```

### 设置版本管理

AppStore 引入了 `SETTING_VERSION` 机制：每次修改默认配置时递增版本号，旧版本的缓存配置会被强制清空为最新默认值，避免新旧字段不兼容。

### 核心方法

#### `updateSetting(partial)`

局部更新设置并持久化到 cache：

```ts
// 切换暗色模式
appStore.updateSetting({ theme: 'dark' })

// 修改主题色
appStore.updateSetting({ primaryColor: '#722ed1' })

// 修改布局
appStore.updateSetting({ layout: 'horizontal' })

// 收起侧边栏
appStore.updateSetting({ sidebarCollapsed: true })
```

#### `resetSetting()`

恢复所有设置为默认值：

```ts
appStore.resetSetting()
```

#### `toggles`

一组快捷开关方法，避免每次手写取反逻辑：

```ts
// 切换侧边栏暗色
appStore.toggles.darkSidebar()

// 切换侧边栏折叠
appStore.toggles.sidebarCollapsed()

// 切换标签页显示
appStore.toggles.showTabs()

// 切换水印
appStore.toggles.enableWatermark()

// 切换色弱模式
appStore.toggles.colorWeak()

// 切换灰度模式
appStore.toggles.grayMode()
```

### 常用 State 速查

```ts
const appStore = useAppStore()

// 主题相关
appStore.themeMode       // 'light' | 'dark' | 'auto'
appStore.themeStyle      // 主题风格
appStore.primaryColor    // 主题色
appStore.borderRadius    // 圆角倍率
appStore.colorWeak       // 色弱模式
appStore.grayMode        // 灰度模式

// 布局相关
appStore.layout          // 'vertical' | 'horizontal' | 'mixed'
appStore.sidebarCollapsed   // 侧边栏是否折叠
appStore.showTabs        // 是否显示多页签
appStore.showBreadcrumb  // 是否显示面包屑

// 通用
appStore.locale          // 语言（'zh-CN' | 'en-US'）
appStore.timezone        // 时区
appStore.enableWatermark // 水印开关
```

---

## useRouteStore

动态路由的管理中心，负责从后端拉取菜单并生成路由树。

### 引入方式

```ts
import { useRouteStore } from '~/stores/modules/route'

const routeStore = useRouteStore()
```

### State

| 字段 | 类型 | 说明 |
|------|------|------|
| `menus` | `Ref<MenuConfig[]>` | 菜单数据（原始） |
| `routes` | `Ref<AppRouteRecordRaw[]>` | 生成的路由树 |
| `isLoaded` | `Ref<boolean>` | 路由是否已初始化 |

### Actions

#### `initBackendRoutes()`

从 `GET /auth/menus` 拉取菜单数据，生成路由树并标记为已加载：

```ts
await routeStore.initBackendRoutes()
// 然后手动注册到 vue-router
routeStore.routes.forEach(route => router.addRoute(route))
```

由路由守卫 `createDynamicRouteGuard` 在登录后首次导航时自动调用，业务代码通常不需要手动调用。

#### `resetRoutes()`

清空路由数据，标记为未加载（页面刷新或重新登录时触发）：

```ts
routeStore.resetRoutes()
```

### 菜单 → 路由转换规则

| 菜单字段 | 说明 |
|---------|------|
| `status !== '1'` | 跳过（停用菜单） |
| `menuType === 3` | 跳过（按钮级权限，不生成路由） |
| `isExternal === true` | 跳过（外部链接，不挂主布局） |
| `layout === 'blank'` | 单独生成无布局路由（全屏页） |
| `component` | 动态 `import.meta.glob` 按路径懒加载 |
| `microApp` | 微应用不加载本地组件 |

---

## useDictStore

数据字典的全局缓存，提供字典数据的懒加载与响应式访问。

### 引入方式

```ts
import { useDictStore } from '~/stores/modules/dict'

const dictStore = useDictStore()
```

### State

| 字段 | 类型 | 说明 |
|------|------|------|
| `dictMap` | `Ref<Record<string, DictItem[]>>` | 字典编码 → 字典项数组（启动时从 cache 恢复，超过 1 小时视为过期） |
| `loading` | `Ref<boolean>` | 是否正在加载 |

### Getters（computed）

| 字段 | 类型 | 说明 |
|------|------|------|
| `isLoaded` | `ComputedRef<boolean>` | 是否至少加载过一类字典 |

### Actions

#### `fetchAllDicts()`

从 `GET /dict-data/code/tree`（`getDictTree`）拉取全部字典并写入内存与 localStorage：

```ts
await dictStore.fetchAllDicts()
```

`getOptions` / `getLabel` **不会自动触发加载**，使用前需确保已调用过 `fetchAllDicts()`。

#### `getOptions(typeCode)`

按字典编码取下拉选项（`label/value` 格式），未找到时返回空数组：

```ts
const statusOptions = dictStore.getOptions('sys_user_sex')
// 返回: [{ label: '男', value: '1' }, { label: '女', value: '0' }]
```

#### `getLabel(typeCode, value)`

按字典编码与值取显示文本，未找到时返回原值字符串：

```ts
const label = dictStore.getLabel('sys_user_sex', '1')
// 返回: '男'
```

#### `refreshDict(typeCode)`

刷新指定字典（当前实现为重新加载全部字典）：

```ts
await dictStore.refreshDict('sys_user_sex')
```

#### `clearDict()`

清空内存中的字典并移除缓存（登出时调用）：

```ts
dictStore.clearDict()
```

### 与 Form Schema 配合

字典数据是异步加载的，在 Schema 中必须使用 `computed` 包裹：

```ts
// ✅ 正确：用 computed 保证字典加载后自动更新
const schemas = computed(() => [
  {
    field: 'status',
    label: '状态',
    component: 'RadioGroup',
    componentProps: () => ({
      options: dictStore.getOptions('sys_status'),
    }),
  },
])

// ❌ 错误：静态数组，字典加载后不会更新
const schemas = [
  {
    field: 'status',
    component: 'RadioGroup',
    componentProps: {
      options: dictStore.getOptions('sys_status'), // 初始为空数组
    },
  },
]
```

---

## useTenantStore

租户下拉选项的加载与缓存，供登录页 / 切换租户等场景使用。

### 引入方式

```ts
import { useTenantStore } from '~/stores/modules/tenant'

const tenantStore = useTenantStore()
```

### State

| 字段 | 类型 | 说明 |
|------|------|------|
| `options` | `Ref<TenantOption[]>` | 租户选项列表（`{ tenantId, tenantCode, tenantName }`） |
| `loading` | `Ref<boolean>` | 是否正在加载 |

### Actions

#### `load(force = false)`

加载租户选项（`GET /tenant/options`）。默认情况下已有数据则不重复请求，传 `force = true` 强制刷新：

```ts
await tenantStore.load()
await tenantStore.load(true) // 强制刷新
```

---

## 跨 Store 调用

在 Store 之间可以直接调用其他 Store（在 `setup` 语法中于函数体内调用，确保 Pinia 已激活）：

```ts
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useSomeStore = defineStore('some', () => {
  const userStore = useUserStore()

  // 根据当前用户权限派生出业务状态
  const canManage = computed(() => userStore.hasPermission('user:update'))
  // ...
})
```

---

## 最佳实践

### 1. 在 `<script setup>` 中使用

```vue
<script setup lang="ts">
import { useUserStore } from '~/stores/modules/user'
import { useAppStore } from '~/stores/modules/app'

const userStore = useUserStore()
const appStore = useAppStore()

const isDark = computed(() => appStore.themeMode === 'dark')
const canCreate = computed(() => userStore.hasPermission('user:create'))
</script>
```

### 2. 在非组件文件中使用

在 Pinia 激活后（`app.use(pinia)` 之后），可在普通函数中调用 Store：

```ts
import { useUserStore } from '~/stores/modules/user'

function canCreateUser(): boolean {
  const userStore = useUserStore()
  return userStore.hasPermission('user:create')
}
```

注意：请确保调用发生在 `app.use(pinia)` 之后，否则会因 Pinia 未安装而报错。

### 3. 不使用 `pinia-plugin-persistedstate`

项目不接入 `pinia-plugin-persistedstate`，所有需要持久化的数据通过 `cache` 工具手动管理，避免全量持久化泄露敏感数据。
