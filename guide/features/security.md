# 安全防护

本项目在前端内置了一组安全工具：XSS 防护、CSRF 防护、数据脱敏、哈希与加密、Token / JWT 解析。它们分布在 `~/utils` 下，彼此独立，可按需引入。

| 模块 | 导入路径 | 作用 |
|------|----------|------|
| XSS 防护与安全指令 | `~/utils/xss` | 转义、过滤、`v-safe-html` / `v-escape` |
| 安全模块统一出口 | `~/utils/security` | 重导出 CSRF + XSS 的**函数与类型**（不含指令） |
| 启动初始化 | `~/utils/securityInit` | `initSecuritySystem()` |
| CSRF 防护 | `~/utils/csrf` | Token 生成与管理 |
| 数据脱敏 | `~/utils/masking` | 手机号、邮箱等掩码 |
| 哈希 / 加密 | `~/utils/crypto` | MD5 / SHA-256、SM4 加解密、JWT 签名 |
| Token 存取 | `~/utils/token` | accessToken 的读写与清理 |
| JWT 解析 | `~/utils/jwt` | 前端解析 payload、判断过期 |

## 应用启动初始化

`~/utils/securityInit` 的 `initSecuritySystem()` 在 `main.ts` 启动时被调用，用于初始化 CSRF 防护：

```ts
// src/main.ts
import { initSecuritySystem } from './utils/securityInit'

initSecuritySystem({
  csrfHeaderName: 'X-CSRF-Token',
  enableDoubleSubmit: true,
  autoRotateToken: true,
})
```

```ts
initSecuritySystem(options?: {
  csrfHeaderName?: string   // CSRF Header 名称，默认 X-CSRF-Token
  enableDoubleSubmit?: boolean // Double Submit Cookie 模式，默认 true
  autoRotateToken?: boolean    // 验证通过后自动轮换 Token，默认 true
}): void
```

它在内部调用 `initCsrfProtection()`，并仅在开发环境（`import.meta.env.DEV`）打印安全状态。

::: warning 与源码不一致之处
`initCsrfProtection()` 是 **async**，而 `initSecuritySystem()` 是同步函数，内部**没有 await**（`src/utils/securityInit.ts:25`），`main.ts:59` 调用处也没有 await。因此启动时只是“发起”初始化，并非“等待完成”。
:::

## 全局注册的指令

`main.ts` 通过 `app.directive(...)` 注册的指令**只有三个**：

```ts
// src/main.ts:67 / 71 / 73
app.directive('safe-html', safeHtmlDirective)
app.directive('escape', escapeDirective)
app.directive('permission', vPermission)
```

| 指令 | 来源 | 说明 |
|------|------|------|
| `v-safe-html` | `~/utils/xss` 的 `safeHtmlDirective` | 安全渲染 HTML |
| `v-escape` | `~/utils/xss` 的 `escapeDirective` | 转义文本 |
| `v-permission` | `~/directives/permission` | 权限控制，详见[权限系统](./permission.md) |

`~/directives` 的出口（`src/directives/index.ts`）只导出了 `vPermission`、`escapeDirective`、`safeHtmlDirective` 三项。

::: warning v-lazy 当前不可用
`src/directives/lazy.ts` 实现并默认导出了一个 `<img>` 懒加载指令（`src/directives/lazy.ts:177`），但：

- 它**没有被 `src/directives/index.ts` 导出**；
- 也**没有在任何地方通过 `app.directive('lazy', ...)` 注册**。

因此在本项目中 `v-lazy` **不是一个可用能力**，模板里写 `v-lazy` 不会生效（Vue 会把未注册的指令当作无操作并告警）。该文件目前只是“已实现、未接线”的状态。
:::

## XSS 防护

核心文件为 `src/utils/xss.ts`，基于 [DOMPurify](https://github.com/cure53/DOMPurify) 做 HTML 清理。

### v-safe-html —— 渲染 HTML

默认允许基础富文本标签，并用 DOMPurify 白名单清理后写入 `innerHTML`。

```vue
<template>
  <!-- 字符串形式 -->
  <div v-safe-html="userContent"></div>

  <!-- 对象形式：content 必填，其余为过滤选项 -->
  <div v-safe-html="{ content: userContent, allowedTags: ['p', 'h3', 'table'] }"></div>
</template>
```

对象形式的可选字段（`XssFilterOptions`，只有 `content` 是必填）：

| 字段 | 说明 | 类型 |
|------|------|------|
| `content` | 待渲染的 HTML 字符串 | `string` |
| `allowHtml` | 是否允许 HTML | `boolean` |
| `allowedTags` | 标签白名单，覆盖内置默认白名单 | `string[]` |
| `forbiddenAttrs` | 禁止的属性 | `string[]` |

内置默认标签白名单包含 `p / br / b / i / strong / em / span / div / h1~h6 / ul / ol / li / table / thead / tbody / tr / th / td / blockquote / pre / code / a / img`（`src/utils/xss.ts:393`），并固定 `ALLOW_DATA_ATTR: false`。

### v-escape —— 转义文本

使用 `textContent` 写入，可带参数指定转义上下文：

```vue
<template>
  <span v-escape="userInput"></span>
  <span v-escape:url="url"></span>
  <span v-escape:js="code"></span>
</template>
```

`binding.arg` 缺省为 `html`，可取 `html | url | js | css | attr`。

### 转义与过滤函数

```ts
import {
  detectXss,
  escapeHtml, escapeUrl, escapeJs, escapeCss, escapeAttr, smartEscape,
  sanitizeInput, sanitizeUrl, purifyHtml,
} from '~/utils/xss'
```

| 函数 | 签名 | 说明 |
|------|------|------|
| `detectXss` | `(input: string) => boolean` | 按内置危险模式正则检测，超长（>10000）直接判为危险 |
| `escapeHtml` | `(str: string) => string` | HTML 实体编码 |
| `escapeUrl` | `(url: string) => string` | 危险协议（`javascript:` 等）返回 `'#unsafe-url'`，否则 `encodeURI` |
| `escapeJs` | `(str: string) => string` | JS 字符串转义 |
| `escapeCss` | `(value: string) => string` | 移除 `expression(` / `javascript:` / `behavior:` 等 |
| `escapeAttr` | `(value: string) => string` | 先 JS 后 HTML 转义 |
| `smartEscape` | `(value, context?: EscapeType) => string` | 按上下文选择上述转义，默认 `html` |
| `sanitizeInput` | `(input, options?: XssFilterOptions) => string` | `allowHtml:false` 时走 `escapeHtml`，否则走 DOMPurify |
| `sanitizeUrl` | `(url, allowRelative?: boolean) => string` | 协议白名单 `http/https/mailto/tel`，不合法返回 `''` |
| `purifyHtml` | `(dirty, options?) => Promise<string>` | 异步版清理，`allowHtml:false` 时退回 `escapeHtml` |

`XssFilterOptions` 各字段默认值：`allowHtml=false`、`allowedTags=[]`、`stripScript=true`、`stripEventHandlers=true`、`maxLength=10000`、`allowUrl=true`、`urlProtocols=['http','https','mailto','tel']`。

> 注意：`detectXss` 命中时会调用 `console.warn`，`escapeUrl` / `sanitizeUrl` 检测到危险协议时同样会告警。

### 统一出口 ~/utils/security

`~/utils/security` 重导出了 CSRF 的全部函数/类型，以及 XSS 的**函数**（`detectXss` 与 `escape*` / `sanitize*` / `purifyHtml` / `smartEscape`）与类型 `EscapeType`、`XssFilterOptions`。

::: warning 指令不在统一出口里
`safeHtmlDirective` / `escapeDirective` **没有**从 `~/utils/security` 或 `~/utils/securityInit` 导出，它们来自 `~/utils/xss`（`src/directives/index.ts:15` 亦是从此处转出）。同样，`~/utils/security` **不包含** `masking` 与 `crypto`。
:::

## CSRF 防护

`src/utils/csrf.ts` 提供 Token 生成、持久化、校验与 `useCsrf()` 组合式函数。

### 配置

```ts
interface CsrfConfig {
  tokenKey?: string     // 存储键名，默认 '__csrf_token'
  headerName?: string   // 默认 'X-CSRF-Token'
  cookieName?: string   // 默认 '__csrf_cookie'
  expiryMs?: number     // 默认 2 小时
  tokenLength?: number  // 默认 32
  doubleSubmit?: boolean// 默认 true
  autoRotate?: boolean  // 默认 false
}
```

### 函数

```ts
import {
  config as csrfConfig,
  createCsrfToken, getCsrfToken, validateCsrfToken, invalidateCsrfToken,
  initCsrfProtection, getCsrfCookieValue, validateDoubleSubmit, useCsrf,
} from '~/utils/csrf'
```

| 函数 | 签名 | 说明 |
|------|------|------|
| `initCsrfProtection` | `(userConfig?) => Promise<void>` | 合并配置并从存储恢复 Token |
| `createCsrfToken` | `() => Promise<CsrfToken>` | 生成新 Token，写内存 / `cache`，Double Submit 下同时写 Cookie |
| `getCsrfToken` | `() => Promise<CsrfToken \| null>` | 内存有效则返回，否则恢复或新建 |
| `validateCsrfToken` | `(provided, shouldRotate?) => Promise<boolean>` | 校验过期 / 匹配 / 重用，成功后标记 `used` |
| `invalidateCsrfToken` | `() => Promise<void>` | 清空当前 Token 与 Cookie |
| `getCsrfCookieValue` | `() => string \| null` | 读取 CSRF Cookie |
| `validateDoubleSubmit` | `(headerToken) => boolean` | 比较 Header 与 Cookie 是否一致 |
| `useCsrf` | `(userConfig?) => { token, headerName, cookieName, refresh, getHeaders, verify, invalidate }` | 响应式封装 |

`CsrfToken` 结构：`{ value: string; createdAt: number; expiresAt: number; used?: boolean }`。

### 请求中的注入

`src/utils/request/alova.ts` 已接线：首次请求时初始化一次 CSRF，并对**状态变更方法**（`POST/PUT/PATCH/DELETE`）自动附带 Token：

```ts
// src/utils/request/alova.ts（节选）
if (STATE_CHANGING_METHODS.includes(methodType)) {
  const csrfToken = await getCsrfToken()
  if (csrfToken?.value) {
    method.config.headers = {
      ...method.config.headers,
      [csrfConfig.headerName]: csrfToken.value,
    }
  }
}
```

### 使用 Composable

```vue
<script setup lang="ts">
import { useCsrf } from '~/utils/csrf'

const { token, headerName, refresh, getHeaders } = useCsrf()
</script>
```

::: warning 现状：当前实现无法形成有效防护
本项目的 CSRF 方案**全部在前端完成**，因此不具备真实的防伪造能力：

- Token 由**前端生成**（`crypto.getRandomValues`，`src/utils/csrf.ts:79`），而非后端下发；
- Cookie 也是前端用 `document.cookie` 自己写入（`src/utils/csrf.ts:278`），并与 Header 由同一份代码维护；
- `validateDoubleSubmit` 的“比对”发生在**前端内部**（`src/utils/csrf.ts:322`），攻击者同样可以在前端伪造两端一致。

也就是说，只有 **Token 由后端下发、并在后端校验** 时才真正有效。目前它更多是占位/待改造能力，不要据此认为接口已受 CSRF 保护。此外 `setCsrfCookie` 里写了 `HttpOnly=false`（`src/utils/csrf.ts:278`），本身也说明它必须让 JS 可读，与安全 Cookie 的常规做法相反。
:::

## 数据脱敏

`src/utils/masking.ts` 用于**展示层**掩码。

```ts
import {
  maskPhone, maskEmail, maskIdCard, maskBankCard,
  maskAddress, maskName, maskGeneric, MASKING_RULES,
} from '~/utils/masking'
```

| 函数 | 签名 | 示例结果 |
|------|------|----------|
| `maskPhone` | `(phone) => string` | `138****1234` |
| `maskEmail` | `(email) => string` | `***@example.com`（前段最多 3 个 `*`） |
| `maskIdCard` | `(idCard) => string` | `110***********1234`（保留前 6 后 4） |
| `maskBankCard` | `(cardNo) => string` | `6222 **** **** 1234` |
| `maskAddress` | `(address) => string` | 前 6 位 + `****`；长度 ≤6 时返回 `***` |
| `maskName` | `(name) => string` | `张*`；单字返回 `*` |
| `maskGeneric` | `(str, keepStart=2, keepEnd=2) => string` | 保留首尾，中间 `*`；过短则整体 `*` |

`MASKING_RULES` 是预置规则库（手机号 / 邮箱 / 身份证号 / 银行卡号），每项为 `{ name, pattern: RegExp, maskFn }`。

::: warning 前端脱敏只用于展示
源码注释已明确（`src/utils/masking.ts:4`）：**真正的脱敏应在服务端完成，前端永远不应该接收到明文敏感数据**。这里的函数只做 UI 掩码，不是安全边界。
:::

## 哈希与加密

`~/utils/crypto` 汇总了哈希、对称加密、JWT 三组能力。

```ts
import {
  // 哈希（不可逆）
  md5, md5File, sha256, hash,
  // 加密（可逆）
  encrypt, decrypt, encryptObject, decryptObject,
  // JWT
  signJwt, verifyJwt, decodeJwt, isJwtExpired,
} from '~/utils/crypto'
```

### 何时用哈希、何时用加密

| | 哈希（`md5` / `sha256` / `hash`） | 加密（`encrypt` / `decrypt`） |
|------|------|------|
| 可逆性 | **不可逆**，只能比对摘要 | **可逆**，可还原原文 |
| 适用 | 文件指纹、去重、完整性校验 | 需要还原的字段（如本地缓存的敏感配置） |
| 不适用 | 需要还原的内容 | 密码 |

### 哈希函数

| 函数 | 签名 | 说明 |
|------|------|------|
| `md5` | `(data: string) => string` | 同步，基于 `spark-md5` |
| `md5File` | `(file: File) => Promise<string>` | 异步读取文件算 MD5 |
| `sha256` | `(data: string) => Promise<string>` | 基于 `crypto.subtle`，**异步** |
| `hash` | `(data, { algorithm = 'md5' }) => string \| Promise<string>` | `md5` 同步返回 string，`sha256` 返回 Promise |

::: warning hash 的返回类型是联合类型
`hash()` 的返回是 `string | Promise<string>`（`src/utils/crypto/hash.ts:40`）。选 `md5` 时拿到的是字符串，选（或省略为）`sha256` 时是 Promise；直接 `await` 对 `md5` 也安全，但用 `typeof` 判断时要留神。
:::

### 加密函数

文件名是 `aes.ts`，但**实际实现是国密 SM4**（`sm-crypto` 的 `sm4`，`src/utils/crypto/aes.ts:1`，非 AES）。

| 函数 | 签名 | 说明 |
|------|------|------|
| `encrypt` | `(data: string, options: AesOptions) => string` | SM4 加密 |
| `decrypt` | `(data: string, options: AesOptions) => string` | SM4 解密 |
| `encryptObject` | `(obj, options) => string` | 先 `JSON.stringify` 再加密 |
| `decryptObject` | `<T>(data, options) => T` | 解密后 `JSON.parse` |

`AesOptions` 为 `{ key: string; iv?: string }`。key 会用 `padKey` 处理：不足 32 位右侧补 `0`，超过则截断到 32 位。

::: warning 加密的注意事项
- `AesOptions.iv` 虽在类型里声明，但 `aes.ts` 的加解密**并未使用** `iv`；SM4 调用只传了 key。
- 未传 `key` 时会回退到硬编码的 `DEFAULT_KEY`（`src/utils/crypto/aes.ts:5`），**不要在生产环境依赖这个默认值**，务必显式传入密钥。
- 加密 ≠ 密码存储。**密码类字段（登录密码、旧/新密码等）不在前端做任何哈希或加密处理**，应原样交给后端，由后端用 bcrypt 等算法处理。
:::

## Token 与 JWT

### Token 存取（~/utils/token）

```ts
import { getToken, setToken, removeToken, hasToken, clearAuth } from '~/utils/token'

getToken()            // string | null，底层走 cache.getItem(TOKEN_KEY)
setToken(token, 7200) // expire 单位秒，可选
removeToken()
hasToken()            // boolean
clearAuth()           // 清 auth_token + 'auth-store' + 'user-info'
```

`TOKEN_KEY = 'auth_token'`，`REFRESH_TOKEN_KEY = 'refresh_token'`（来自 `~/config/constants`）。

### JWT 解析（~/utils/jwt）

用于前端读取 payload 与判断过期，**不验证签名**：

```ts
import { parseJwt, isTokenExpired, getTokenRemainingSeconds, isJwtFormat } from '~/utils/jwt'
```

| 函数 | 签名 | 说明 |
|------|------|------|
| `parseJwt` | `(token) => JwtPayload \| null` | 解析 payload（base64url 解码，UTF-8 安全），非 3 段返回 `null` |
| `isTokenExpired` | `(token, offsetSeconds = 60) => boolean` | 已过期 / 快过期（默认提前 60s）/ 无 token 返回 `true`；非标准 JWT 或没有 `exp` 返回 `false` |
| `getTokenRemainingSeconds` | `(token) => number` | 剩余秒数；无 `exp` 返回 `Infinity` |
| `isJwtFormat` | `(token) => boolean` | 是否 3 段结构 |

### JWT 签名 / 校验（~/utils/crypto）

基于 `jose`，后端同款能力，纯前端场景通常用不到：

| 函数 | 签名 | 说明 |
|------|------|------|
| `signJwt` | `(payload, { secret, expiresIn }) => Promise<string>` | HS256 签发，`expiresIn` 支持秒数或时长字符串 |
| `verifyJwt` | `<T>(token, secret) => Promise<T \| null>` | 验签失败返回 `null` |
| `decodeJwt` | `<T>(token) => T \| null` | 仅解码 |
| `isJwtExpired` | `(token) => boolean` | 无 `exp` 视为已过期（与 `~/utils/jwt` 的 `isTokenExpired` 语义**相反**） |

::: warning 两套 JWT 工具，语义不一致
项目里存在两处 JWT 工具，别混用：

- `~/utils/jwt`：`isTokenExpired` —— 无 `exp` 时返回 **`false`**（视为长期有效），并支持提前量。
- `~/utils/crypto`：`isJwtExpired` —— 无 `exp` 时返回 **`true`**（视为已过期）。

两者的 `JwtPayload` 类型定义也各自独立。业务里判断“该不该刷新 Token”应优先用 `~/utils/jwt` 的 `isTokenExpired`。
:::
