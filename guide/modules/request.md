# HTTP 请求

本项目使用 **Alova 3** 作为 HTTP 客户端，基于 Fetch API 实现，封装了 Token 注入、无感刷新、自动重试、请求共享等能力。

## 核心文件

```
src/utils/request/
├── alova.ts      # 核心：Alova 实例创建工厂（含刷新、重试逻辑）
├── constant.ts   # 常量（Authorization Header 名等）
├── index.ts      # 导出 http 实例
└── interface.ts  # RequestMeta 等类型定义
```

---

## 快速开始

### API 函数集中定义

所有接口定义集中在 `src/api/` 目录，不在组件中直接调用 `http`：

```ts
// src/api/system/user.ts
import { get, post, put, del } from '~/api/request'

// 用户列表
export function getUserList(params: UserQueryParams) {
  return get<PageResult<UserRecord>>('/user/list', params)
}

// 创建用户
export function createUser(data: CreateUserDTO) {
  return post<UserRecord>('/user', data)
}

// 更新用户（注意：后端用 POST，不是 PUT）
export function updateUser(id: string, data: UpdateUserDTO) {
  return post<void>(`/user/update/${id}`, data)
}

// 删除用户
export function deleteUser(id: string) {
  return del<void>(`/user/remove/${id}`)
}
```

### 在组件中使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { getUserList, deleteUser } from '~/api/system/user'
import type { UserRecord } from '~/api/system/user'

const loading = ref(false)
const userList = ref<UserRecord[]>([])

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUserList({ page: 1, pageSize: 20 })
    userList.value = res.list
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: string) {
  await deleteUser(id)
  message.success('删除成功')
  fetchUsers()
}
</script>
```

::: tip 业务组件无需 try/catch 做 toast
Alova 拦截器已统一处理 4xx/5xx 的错误 toast。组件只需在需要**额外逻辑**（如成功后刷新列表）时使用 `try/catch`。
:::

---

## http 实例

```ts
import { http } from '~/utils/request'

// 等同于：
http.Get('/path', params)
http.Post('/path', body)
http.Put('/path', body)
http.Delete('/path')
```

`http` 是通过 `createRequestClient()` 创建的 Alova 实例，配置如下：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `baseURL` | `import.meta.env.VITE_APP_BASE_API` | API 基础路径（如 `/api/v1`） |
| `requestAdapter` | `adapterFetch()` | 基于原生 Fetch |
| `shareRequest` | `true` | 相同请求自动合并 |
| `timeout` | `30000` ms | 请求超时 30 秒 |
| `maxRetries` | `3` | 最大重试次数 |

---

## 自动化能力

### Token 自动注入

`beforeRequest` 拦截器从 `cache` 读取 token，注入到 `Authorization: Bearer <token>` Header：

```ts
// beforeRequest 内部逻辑（简化）
const accessToken = cache.getItem(TOKEN_KEY)
method.config.headers[AUTHORIZATION_KEY] = `Bearer ${accessToken}`
```

认证相关接口（`/auth/login`、`/auth/refresh` 等）不注入 token。

### 401 无感刷新

收到 401 时自动用 refresh token 换取新 access token，然后重发原请求：

```
请求 → 收到 401
    │
    ▼
并发请求 → 共用同一个 refreshPromise（防重复刷新）
    │
    ▼
POST /auth/refresh { refreshToken }
    │
    ├─ 成功 → 更新缓存中的 access / refresh token（TOKEN_KEY / REFRESH_TOKEN_KEY）→ 重发原请求
    │
    └─ 失败 → forceLogout()（清 token + 跳 /login，不调登出接口）→ 抛 handled=true 的错误
```

多个并发请求同时 401 时，只有一个真正执行 refresh，其余等待结果后统一重试。

### 主动预刷新

`beforeRequest` 中检测 access token 的剩余有效期，**低于阈值时主动刷新**，避免在请求途中因 token 过期导致 401：

```ts
// 剩余有效期不足 60 秒时主动刷新（isTokenExpired 的 offsetSeconds 默认 60）
if (isTokenExpired(accessToken, 60)) {
  await getRefreshPromise()
}
```

### 自动重试（指数退避）

可重试的错误（5xx 状态码、网络超时、`408`、`429`）按指数退避策略重试：

```
重试间隔 = min(300 * 2^n + 随机抖动(0~200ms), 10000ms)   // n = 第几次重试，从 1 开始
```

| 第几次重试 | 等待时间（约） |
|-----------|---------------|
| 1 | ~0.6 秒 |
| 2 | ~1.2 秒 |
| 3 | ~2.4 秒 |

超过 `maxRetries`（默认 3）后抛出错误。

4xx 错误（业务错误）不重试。

### 请求去重（shareRequest）

`shareRequest: true` 启用后，相同的请求在第一个未完成时，后续相同请求会等待并共享同一结果，**不会重复发送**：

```ts
// 这两个同时调用，实际只发一个请求
getUserList({ page: 1 })
getUserList({ page: 1 })
```

---

## 响应拦截逻辑

### 成功响应

后端统一响应结构：

```ts
interface ApiResponse<T = unknown> {
  code: number        // 200 为成功
  message?: string
  timestamp?: number
  data?: T
}
```

`responded.onSuccess` 中：
- `code === 200` → 返回**完整响应体** `{ code, data, message, timestamp }`（`~/api/request` 的 `get/post/put/del` 工具函数会再取一层 `.data`）
- `code !== 200` → 抛出业务错误（除 `SILENT_ERROR_CODES` 中的码不弹 toast）

### 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| `401` | 尝试刷新 → 失败则 `forceLogout()` 跳登录（不弹 toast） |
| `403` | 与普通 `4xx` 一致：`notification.error({ title: '请求错误', description: 后端 message })` |
| `4xx` | 同上，description 取后端 `message` |
| `5xx` | `notification.error({ title: '请求错误', description: 后端 message 或「服务器繁忙，请稍后重试」 })` + 重试 |
| 网络超时 | 重试（最多 `maxRetries` 次） |

---

## 业务错误码

后端返回的业务码定义（`ErrorCode`）：

```ts
const ErrorCode = {
  SUCCESS: 200,

  VALIDATION_FAILED: 400001,  // 参数校验失败
  UNAUTHORIZED: 401001,        // 未认证
  FORBIDDEN: 403001,           // 无权限
  NOT_FOUND: 404001,           // 资源不存在
  BLOCKED: 403,                // 账号被封禁

  INTERNAL_ERROR: 500000,      // 服务内部错误
  HTTP_BAD_GATEWAY: 502,
  HTTP_SERVICE_UNAVAILABLE: 503,
  HTTP_GATEWAY_TIMEOUT: 504,
}
```

---

## CSRF 防护

`beforeRequest` 首次运行时初始化 CSRF 保护，为每个 `POST/PUT/PATCH/DELETE` 请求自动注入 `X-CSRF-Token` Header：

```ts
initCsrfProtection({
  headerName: 'X-CSRF-Token',
  doubleSubmit: true,
  autoRotate: true,
})
```

::: warning CSRF 实现注意事项
当前 CSRF token 由前端生成（双提交 Cookie 模式），如需更严格的安全策略，应改由后端下发 token。详见安全规范。
:::

---

## RequestMeta 扩展字段

目前 `meta` 仅支持 `responseType`（见 `alova.ts` 的 `onSuccess`）：

```ts
// 以二进制方式接收响应，短路 JSON 解析，直接返回 Blob / ArrayBuffer
http.Get('/file/download', { meta: { responseType: 'blob' } })
```

---

## 开发代理配置

开发环境通过 `vite.config.ts` 中的 `server.proxy` 把 `/api/v1` 请求代理到后端：

```ts
// .env.development
VITE_PROXY=[['/api/v1', 'http://localhost:3000/api/v1'],['/uploads', 'http://localhost:3000/uploads'],['/ws', 'ws://localhost:3000/ws']]
```

代理配置由 `createProxy(VITE_PROXY)` 解析，自动加 `changeOrigin: true`。

---

## API 文件组织规范

```
src/api/
├── index.ts          # 统一导出所有 API
├── request.ts        # get/post/put/del 工具函数
├── auth.ts           # 认证相关
├── system/
│   ├── user.ts       # 用户管理
│   ├── role.ts       # 角色管理
│   ├── menu.ts       # 菜单管理
│   └── dept.ts       # 部门管理
└── monitor/
    ├── log.ts        # 操作日志
    └── online.ts     # 在线用户
```

每个 API 文件：
- 按业务模块拆分
- 函数命名遵循 `动词 + 名词`（`getUser`、`createRole`、`deleteMenu`）
- 接口注释说明请求方法、路径、参数
